// backend/src/index.ts

// --- Load Environment Variables ---
import dotenv from 'dotenv';
dotenv.config();

// --- Verify DATABASE_URL is loaded (for debugging) ---
console.log('>>> DATABASE_URL Host Loaded:', process.env.DATABASE_URL?.split('@')[1]?.split('/')[0] || '!!! DATABASE_URL NOT LOADED !!!');

// --- Imports ---
import express, { Request, Response, Application, NextFunction, RequestHandler } from 'express';
import cors from 'cors';
import {
  PrismaClient,
  PaymentMethod,
  OrderPaymentStatus,
  OrderProcessStatus,
  Prisma,
} from '@prisma/client';
import { ZodError, z } from 'zod';

// --- App Initialization ---
const app: Application = express();
const port: number = process.env.PORT ? parseInt(process.env.PORT) : 3001;

// --- Prisma Client ---
const prisma = new PrismaClient();

// --- Middleware ---
app.use(cors());
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

// --- GET Route Handlers ---
const getStoresHandler: RequestHandler = async (req, res, next) => {
  try {
    const stores = await prisma.store.findMany({ orderBy: { name: 'asc' } });
    res.status(200).json(stores); // Send response
  } catch (error) {
    console.error('Failed to fetch stores:', error);
    res.status(500).json({ error: 'Failed to fetch stores.' }); // Send error response
  }
};

const getCategoriesHandler: RequestHandler = async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({ orderBy: { name: 'asc' } });
    res.status(200).json(categories); // Send response
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories.' }); // Send error response
  }
};

const getProductsHandler: RequestHandler = async (req, res, next) => {
  try {
    const products = await prisma.product.findMany({
      where: { is_active: true },
      include: { variants: { orderBy: { name: 'asc' } }, category: true },
      orderBy: { name: 'asc' }
    });
    res.status(200).json(products); // Send response
  } catch (error) {
    console.error('Failed to fetch products:', error);
    res.status(500).json({ error: 'Failed to fetch products.' }); // Send error response
  }
};

const getChargesHandler: RequestHandler = async (req, res, next) => {
  try {
    const charges = await prisma.charge.findMany({ orderBy: { name: 'asc' } });
    res.status(200).json(charges); // Send response
  } catch (error) {
    console.error('Failed to fetch charges:', error);
    res.status(500).json({ error: 'Failed to fetch charges.' }); // Send error response
  }
};

// --- POST Route Handler ---
const createOrderHandler: RequestHandler = async (req, res, next) => {
  try {
    // 1. Validate input
    const orderPayload: CreateOrderPayload = CreateOrderPayloadSchema.parse(req.body);

    // --- Calculations ---
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
        if (!chargeDetail) {
          res.status(400).json({ error: `Charge with ID ${appliedCharge.chargeId} not found.` }); // Send response
          return; // Exit handler
        }
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

    // --- Payment Status Logic ---
    if (orderPayload.payment_method === PaymentMethod.Cash) {
      if (typeof orderPayload.amount_received !== 'number') {
        res.status(400).json({ error: 'Amount received must be provided.' }); // Send response
        return; // Exit handler
      }
      if (orderPayload.amount_received < total_amount) {
        res.status(400).json({ error: 'Amount received is less than total amount.' }); // Send response
        return; // Exit handler
       }
      change_given = parseFloat((orderPayload.amount_received - total_amount).toFixed(2));
      payment_status = OrderPaymentStatus.Paid;
    } else if (
        orderPayload.payment_method === PaymentMethod.Card ||
        orderPayload.payment_method === PaymentMethod.UPI ||
        orderPayload.payment_method === PaymentMethod.Swiggy ||
        orderPayload.payment_method === PaymentMethod.Zomato ||
        orderPayload.payment_method === PaymentMethod.Other
      ) {
      payment_status = OrderPaymentStatus.Paid;
    }

    const orderItemsCreateData: Prisma.OrderItemCreateManyOrderInput[] = orderPayload.items.map(item => ({
      variantId: item.variantId, quantity: item.quantity, unit_price: item.unit_price,
      total_price: parseFloat((item.unit_price * item.quantity).toFixed(2)),
    }));

    // --- Transaction Block ---
    const createdOrder = await prisma.$transaction(async (tx) => {
      // Check Inventory
      for (const item of orderPayload.items) {
        const inventoryItem = await tx.inventory.findUnique({ where: { variantId_storeId: { variantId: item.variantId, storeId: orderPayload.storeId } } });
        if (!inventoryItem || inventoryItem.quantity < item.quantity) {
          throw new Error(`Insufficient stock for Variant ID ${item.variantId}. Available: ${inventoryItem?.quantity ?? 0}, Needed: ${item.quantity}`);
        }
      }
      // Create Order
      const order = await tx.order.create({
        data: { /* ... same data fields as before ... */ 
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
      // Deduct Inventory
      for (const item of orderPayload.items) {
        await tx.inventory.update({
          where: { variantId_storeId: { variantId: item.variantId, storeId: orderPayload.storeId } },
          data: { quantity: { decrement: item.quantity } },
        });
      }
      return order;
    }, { timeout: 15000 }); // End transaction

    res.status(201).json(createdOrder); // Send success response

  } catch (error) {
     // --- Error Handling ---
    if (error instanceof ZodError) {
      console.error("Zod Validation Error:", error.errors);
      res.status(400).json({ error: 'Invalid order data provided.', details: error.errors }); // Send response
      return; // Exit handler
    }
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Prisma Error:", error.code, error.message);
      if (error.code === 'P2003') { res.status(400).json({ error: 'Invalid reference ID.' }); return; }
      if (error.code === 'P2025') { res.status(400).json({ error: 'Inventory record not found.' }); return; }
      if (error.code === 'P2028') { res.status(500).json({ error: 'Transaction failed or timed out.' }); return; }
    }
    if (error instanceof Error && error.message.startsWith('Insufficient stock')) {
      res.status(400).json({ error: error.message }); // Send response
      return; // Exit handler
    }
    // Fallback for unexpected errors
    console.error("Failed to create order:", error);
    res.status(500).json({ error: 'Failed to create order.' }); // Send generic error response
    // Optionally use next(error); if you have Express error middleware
  }
}; // End of createOrderHandler

// --- Assign Routes ---
app.get('/', (req: Request, res: Response) => { res.send('Welcome to Kunafa Kingdom API!'); });
app.get('/api/stores', getStoresHandler);
app.get('/api/categories', getCategoriesHandler);
app.get('/api/products', getProductsHandler);
app.get('/api/charges', getChargesHandler);
app.post('/api/orders', createOrderHandler);


// --- Server Start & Graceful Shutdown ---
const server = app.listen(port, () => {
  console.log(`✅ Server is running on http://localhost:${port}`);
});

const gracefulShutdown = async (signal: string) => {
  console.log(`\n👋 Received ${signal}. Closing HTTP server.`);
  server.close(async () => {
    console.log('🛡️ HTTP server closed.'); await prisma.$disconnect(); console.log('🍃 Prisma Client disconnected.'); process.exit(0);
  });
};
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));