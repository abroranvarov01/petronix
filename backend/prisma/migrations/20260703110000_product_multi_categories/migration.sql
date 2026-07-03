-- A product now belongs to multiple categories; the unused brand field is removed.
ALTER TABLE "Product" ADD COLUMN "types" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Preserve the existing single category of every product.
UPDATE "Product" SET "types" = ARRAY["type"] WHERE "type" <> '';

DROP INDEX "Product_type_idx";
ALTER TABLE "Product" DROP COLUMN "type";
ALTER TABLE "Product" DROP COLUMN "brand";

CREATE INDEX "Product_types_idx" ON "Product" USING GIN ("types");
