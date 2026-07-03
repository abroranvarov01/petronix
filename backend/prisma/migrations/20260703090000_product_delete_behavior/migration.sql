-- Deleting a product must not 500 when it appears in orders or supplies.
-- OrderItem: keep the order line (nameSnapshot holds the name), null the reference.
ALTER TABLE "OrderItem" DROP CONSTRAINT "OrderItem_productId_fkey";
ALTER TABLE "OrderItem" ALTER COLUMN "productId" DROP NOT NULL;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- SupplyItem: supply lines of a deleted product are removed with it
-- (consistent with Stock/StockMovement which already cascade).
ALTER TABLE "SupplyItem" DROP CONSTRAINT "SupplyItem_productId_fkey";
ALTER TABLE "SupplyItem" ADD CONSTRAINT "SupplyItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
