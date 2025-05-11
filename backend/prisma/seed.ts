import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log(`🌱 Start seeding ...`);

  // --- Create Stores ---
  console.log('Creating stores...');
  const storeKompally = await prisma.store.upsert({
    where: { name: 'Kompally Branch' }, // Use a unique field for where, like name
    update: {}, // No updates if it exists, just ensure it's there
    create: {
      name: 'Kompally Branch',
      address: '123 Kompally Main Rd, Hyderabad',
      phone_number: '9876543210',
    },
  });

  const storeASRaoNagar = await prisma.store.upsert({
    where: { name: 'AS Rao Nagar Branch' },
    update: {},
    create: {
      name: 'AS Rao Nagar Branch',
      address: '456 AS Rao Nagar Circle, Hyderabad',
      phone_number: '9876543211',
    },
  });

  const storeKondapur = await prisma.store.upsert({
    where: { name: 'Kondapur Branch' },
    update: {},
    create: {
      name: 'Kondapur Branch',
      address: '789 Kondapur High Street, Hyderabad',
      phone_number: '9876543212',
    },
  });
  console.log('Stores created:', storeKompally.name, storeASRaoNagar.name, storeKondapur.name);

  // --- Create Categories ---
  console.log('Creating categories...');
  const categoryKunafa = await prisma.category.upsert({
    where: { name: 'Kunafa' },
    update: {},
    create: { name: 'Kunafa' },
  });

  const categoryBaklava = await prisma.category.upsert({
    where: { name: 'Baklava' },
    update: {},
    create: { name: 'Baklava' },
  });

  const categoryBeverages = await prisma.category.upsert({
    where: { name: 'Beverages' },
    update: {},
    create: { name: 'Beverages' },
  });
  console.log('Categories created:', categoryKunafa.name, categoryBaklava.name, categoryBeverages.name);

  // --- Create Products and Variants ---
  console.log('Creating products and variants...');
  // Product 1: Classic Cheese Kunafa
  const productClassicKunafa = await prisma.product.upsert({
    where: { name: 'Classic Cheese Kunafa' },
    update: {},
    create: {
      name: 'Classic Cheese Kunafa',
      description: 'The timeless classic, crispy and cheesy.',
      categoryId: categoryKunafa.id,
      is_active: true,
    },
  });
  await prisma.productVariant.upsert({
    where: { sku: 'KUN-CLS-REG' }, // SKU must be unique if used in where
    update: {},
    create: { productId: productClassicKunafa.id, name: 'Regular', price: 250, sku: 'KUN-CLS-REG' },
  });
  await prisma.productVariant.upsert({
    where: { sku: 'KUN-CLS-LRG' },
    update: {},
    create: { productId: productClassicKunafa.id, name: 'Large', price: 450, sku: 'KUN-CLS-LRG' },
  });
  console.log(`Product created: ${productClassicKunafa.name} with variants`);

  // Product 2: Nutella Kunafa
  const productNutellaKunafa = await prisma.product.upsert({
    where: { name: 'Nutella Kunafa' },
    update: {},
    create: {
      name: 'Nutella Kunafa',
      description: 'A decadent twist with rich Nutella.',
      categoryId: categoryKunafa.id,
      is_active: true,
    },
  });
  await prisma.productVariant.upsert({
    where: { sku: 'KUN-NUT-REG' },
    update: {},
    create: { productId: productNutellaKunafa.id, name: 'Regular', price: 300, sku: 'KUN-NUT-REG' },
  });
  console.log(`Product created: ${productNutellaKunafa.name} with variants`);

  // Product 3: Assorted Baklava Box
  const productAssortedBaklava = await prisma.product.upsert({
    where: { name: 'Assorted Baklava Box' },
    update: {},
    create: {
      name: 'Assorted Baklava Box',
      description: 'A delightful mix of our finest baklavas.',
      categoryId: categoryBaklava.id,
      is_active: true,
    },
  });
  const baklava250g = await prisma.productVariant.upsert({
    where: { sku: 'BAK-MIX-250G' },
    update: {},
    create: { productId: productAssortedBaklava.id, name: '250g Box', price: 400, sku: 'BAK-MIX-250G' },
  });
  await prisma.productVariant.upsert({
    where: { sku: 'BAK-MIX-500G' },
    update: {},
    create: { productId: productAssortedBaklava.id, name: '500g Box', price: 750, sku: 'BAK-MIX-500G' },
  });
  console.log(`Product created: ${productAssortedBaklava.name} with variants`);

  // --- Create Charges ---
  console.log('Creating charges...');
  await prisma.charge.upsert({
    where: { name: 'Packaging Charge' },
    update: {},
    create: { name: 'Packaging Charge', amount: 20, is_taxable: false },
  });
  await prisma.charge.upsert({
    where: { name: 'Delivery Fee (Local)' },
    update: {},
    create: { name: 'Delivery Fee (Local)', amount: 50, is_taxable: false },
  });
  console.log('Charges created.');

  // --- Create Initial Inventory (Optional - for one store) ---
  console.log('Creating initial inventory for Kompally Branch...');
  if (baklava250g) { // Ensure variant was created
    await prisma.inventory.upsert({
        where: { variantId_storeId: { variantId: baklava250g.id, storeId: storeKompally.id } },
        update: { quantity: 50 }, // If it exists, update quantity
        create: {
            variantId: baklava250g.id,
            storeId: storeKompally.id,
            quantity: 50, // Initial quantity
            min_threshold: 10,
        }
    });
    console.log(`Inventory for ${baklava250g.name} at ${storeKompally.name} set.`);
  }

  console.log(`🌳 Seeding finished.`);
}

main()
  .catch(async (e) => {
    console.error('🔴 Seeding failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });