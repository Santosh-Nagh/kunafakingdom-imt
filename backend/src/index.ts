// backend/src/index.ts (Vercel Serverless Version)

// --- Load Environment Variables ---
import dotenv from 'dotenv';
dotenv.config(); // Vercel will use its own environment variables in production

// --- Verify DATABASE_URL is loaded (for debugging during local Vercel dev or if needed) ---
// console.log('>>> DATABASE_URL Host (Backend):', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || '!!! DATABASE_URL NOT LOADED !!!');

// --- Imports ---
import express, { Request, Response, Application, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import {
  PrismaClient,
  PaymentMethod,
  OrderPaymentStatus,
  OrderProcessStatus,
  Prisma,
  InventoryTrackingMethod,
} from '@prisma/client';
import { ZodError, z } from 'zod';

// --- App Initialization ---
const app: Application = express();
// const port: number = process.env.PORT ? parseInt(process.env.PORT) : 3001; // PORT is not used with app.listen

// --- Prisma Client ---
const prisma = new PrismaClient();

// --- Middleware ---
app.use(cors()); // Allows all origins by default - good for start, can be configured for production
app.use(express.json());

// --- DTOs and Validation Schemas (using Zod) ---
const AppliedChargeSchema = z.object({
  chargeId: z.string().uuid("Invalid Charge ID format"),
  amount_charged: z.number().min(0, "Amount charged cannot be negative"),
});
const OrderItemSchema = z.object({
  variantId: z.string().uuid("Invalid Variant ID format"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
  unit_price: z.number().min(0, "Unit price cannot be negative"),
});
const CreateOrderPayloadSchema = z.object({
  storeId: z.string().uuid("Invalid Store ID format"),
  customer_name: z.string().optional(),
  customer_phone: z.string().optional(),
  aggregator_id: z.string().optional(),
  payment_method: z.nativeEnum(PaymentMethod),
  amount_received: z.number().optional(),
  notes: z.string().optional(),
  items: z.array(OrderItemSchema).min(1, "Order must have at least one item"),
  applied_charges: z.array(AppliedChargeSchema).optional(),
});
type CreateOrderPayload = z.infer<typeof CreateOrderPayloadSchema>;

// --- GET Route Handlers (defined as constants) ---
const getRootHandler: RequestHandler = (req, res) => {
  res.send('Welcome to Kunafa Kingdom API!');
};
const getStoresHandler: RequestHandler = async (req, res, next) => {
  try {
    const stores = await prisma.store.findMany({ orderBy: { name: 'asc' } });
    res.status(200).json(stores);
  } catch (error) {
    console.error('Failed to fetch stores:', error);
    res.status(500).json({ error: 'Failed to fetch stores.' });
  }
};
const getCategoriesHandler: RequestHandler = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.status(200).json(categories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories.' });
  }
};
const getProductsHandler: RequestHandler = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { is_active: true },
      include: { variants: { orderBy: { name: 'asc' } }, category: true },
      orderBy: { name: 'asc' }
    });
    res.status(200).json(products);
  } catch (error) {
    console.error('Failed to fetch products:', error);
    res.status(500).json({ error: 'Failed to fetch products.' });
  }
};
const getChargesHandler: RequestHandler = async (req, res, next) => {
  try {
    const charges = await prisma.charge.findMany({ orderBy: { name: 'asc' } });
    res.status(200).json(charges);
  } catch (error) {
    console.error('Failed to fetch charges:', error);
    res.status(500).json({ error: 'Failed to fetch charges.' });
  }
};

// --- POST Route Handler (defined as a constant) ---
const createOrderHandler: RequestHandler = async (req, res, next) => {
  try {
    const orderPayload: CreateOrderPayload = CreateOrderPayloadSchema.parse(req.body);
    // ... (calculations for subtotal, taxes, etc. - same as before)
    const subtotal = orderPayload.items.reduce((acc, item) => acc + item.unit_price * item.quantity, 0);
    let applied_charges_amount_taxable = 0;
    let applied_charges_amount_nontaxable = 0;
    const orderAppliedChargesCreateData: Prisma.OrderAppliedChargeCreateManyOrderInput[] = [];
    if (orderPayload.applied_charges && orderPayload.applied_charges.length > 0) {
      const chargeIds = orderPayload.applied_charges.map(c => c.chargeId);
      const chargeDetailsMap = new Map<string, { is_taxable: boolean }>();
      const dbCharges = await prisma.charge.findMany({ where: { id: { in: chargeIds } } });
      dbCharges.forEach(dbCharge => chargeDetailsMap.set(dbCharge.id, { is_taxable: dbCharge.is_taxable }));
      for (const appliedCharge of orderPayload.applied_charges) {
        const chargeDetail = chargeDetailsMap.get(appliedCharge.chargeId);
        if (!chargeDetail) { res.status(400).json({ error: `Charge with ID ${appliedCharge.chargeId} not found.` }); return; }
        if (chargeDetail.is_taxable) { applied_charges_amount_taxable += appliedCharge.amount_charged; }
        else { applied_charges_amount_nontaxable += appliedCharge.amount_charged; }
        orderAppliedChargesCreateData.push({ chargeId: appliedCharge.chargeId, amount_charged: appliedCharge.amount_charged });
      }
    }
    const taxable_amount = subtotal + applied_charges_amount_taxable;
    const cgst_rate = 0.09; const sgst_rate = 0.09;
    const cgst_amount = parseFloat((taxable_amount * cgst_rate).toFixed(2));
    const sgst_amount = parseFloat((taxable_amount * sgst_rate).toFixed(2));
    const total_amount = parseFloat((taxable_amount + cgst_amount + sgst_amount + applied_charges_amount_nontaxable).toFixed(2));
    let change_given: number | undefined = undefined;
    let payment_status: OrderPaymentStatus = OrderPaymentStatus.Pending;
    if (orderPayload.payment_method === PaymentMethod.Cash) {
      if (typeof orderPayload.amount_received !== 'number') { res.status(400).json({ error: 'Amount received must be provided.' }); return; }
      if (orderPayload.amount_received < total_amount) { res.status(400).json({ error: 'Amount received is less than total amount.' }); return; }
      change_given = parseFloat((orderPayload.amount_received - total_amount).toFixed(2));
      payment_status = OrderPaymentStatus.Paid;
    } else if ( [PaymentMethod.Card, PaymentMethod.UPI, PaymentMethod.Swiggy, PaymentMethod.Zomato, PaymentMethod.Other].includes(orderPayload.payment_method) ) {
      payment_status = OrderPaymentStatus.Paid;
    }
    const orderItemsCreateData: Prisma.OrderItemCreateManyOrderInput[] = orderPayload.items.map(item => ({
      variantId: item.variantId, quantity: item.quantity, unit_price: item.unit_price,
      total_price: parseFloat((item.unit_price * item.quantity).toFixed(2)),
    }));

    // --- Transaction Block (same as before) ---
    const createdOrder = await prisma.$transaction(async (tx) => {
      const variantIdsInOrder = orderPayload.items.map(item => item.variantId);
      const variantsInDB = await tx.productVariant.findMany({
        where: { id: { in: variantIdsInOrder } },
        select: { id: true, inventoryTrackingMethod: true, name: true, product: { select: { name: true } } }
      });
      const variantInfoMap = new Map(variantsInDB.map(v => [v.id, v]));

      for (const item of orderPayload.items) {
        const variantDetails = variantInfoMap.get(item.variantId);
        if (!variantDetails) {
          throw new Error(`Product variant with ID ${item.variantId} not found.`);
        }
        if (variantDetails.inventoryTrackingMethod === InventoryTrackingMethod.TrackedBatch) {
          const inventoryItem = await tx.inventory.findUnique({
            where: { variantId_storeId: { variantId: item.variantId, storeId: orderPayload.storeId } }
          });
          if (!inventoryItem || inventoryItem.quantity < item.quantity) {
            throw new Error(`Insufficient stock for ${variantDetails.product.name} - ${variantDetails.name}. Available: ${inventoryItem?.quantity ?? 0}, Needed: ${item.quantity}`);
          }
          await tx.inventory.update({
            where: { variantId_storeId: { variantId: item.variantId, storeId: orderPayload.storeId } },
            data: { quantity: { decrement: item.quantity } },
          });
        }
      }
      const order = await tx.order.create({
        data: { /* ...same data fields... */ 
          storeId: orderPayload.storeId, customer_name: orderPayload.customer_name, customer_phone: orderPayload.customer_phone,
          aggregator_id: orderPayload.aggregator_id, payment_method: orderPayload.payment_method, amount_received: orderPayload.amount_received,
          change_given: change_given, subtotal: subtotal, applied_charges_amount_taxable: applied_charges_amount_taxable,
          applied_charges_amount_nontaxable: applied_charges_amount_nontaxable, taxable_amount: taxable_amount,
          cgst_amount: cgst_amount, sgst_amount: sgst_amount, total_amount: total_amount, payment_status: payment_status,
          order_status: OrderProcessStatus.Received, notes: orderPayload.notes,
          items: { createMany: { data: orderItemsCreateData } },
          applied_charges: { createMany: { data: orderAppliedChargesCreateData } },
        },
        include: { items: { include: { variant: { include: { product: true } } } }, applied_charges: { include: { charge: true } }, store: true },
      });
      return order;
    }, { timeout: 15000 });

    res.status(201).json(createdOrder);

  } catch (error) {
    // --- Error Handling (same as before) ---
    if (error instanceof ZodError) { console.error("Zod Error:", error.errors); res.status(400).json({ error: 'Invalid order data.', details: error.errors }); return; }
    if (error instanceof Prisma.PrismaClientKnownRequestError) { /* ... same specific prisma error checks ... */ 
        console.error("Prisma Error:", error.code, error.message); 
        if (error.code === 'P2003') { res.status(400).json({ error: 'Invalid reference ID.' }); return; } 
        if (error.code === 'P2025') { res.status(400).json({ error: 'Inventory record not found.' }); return; } 
        if (error.code === 'P2028') {res.status(500).json({ error: 'Transaction failed or timed out.' }); return;} 
    }
    if (error instanceof Error && error.message.startsWith('Insufficient stock')) { res.status(400).json({ error: error.message }); return; }
    if (error instanceof Error) {
        console.error("Error during order creation:", error.message);
        res.status(400).json({ error: error.message });
        return;
    }
    console.error("Failed to create order (unknown type):", error); 
    res.status(500).json({ error: 'Failed to create order due to an unexpected issue.' });
  }
};

// --- Assign Routes ---
app.get('/', getRootHandler); // Welcome route
app.get('/api/stores', getStoresHandler);
app.get('/api/categories', getCategoriesHandler);
app.get('/api/products', getProductsHandler);
app.get('/api/charges', getChargesHandler);
app.post('/api/orders', createOrderHandler);

// --- REMOVED app.listen(...) and gracefulShutdown ---

// --- EXPORT THE APP FOR VERCEL ---
export default app;