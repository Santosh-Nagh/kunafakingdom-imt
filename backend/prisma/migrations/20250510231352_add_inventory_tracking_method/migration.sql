-- CreateEnum
CREATE TYPE "InventoryTrackingMethod" AS ENUM ('TrackedBatch', 'MadeToOrder');

-- AlterTable
ALTER TABLE "ProductVariant" ADD COLUMN     "inventoryTrackingMethod" "InventoryTrackingMethod" NOT NULL DEFAULT 'TrackedBatch';
