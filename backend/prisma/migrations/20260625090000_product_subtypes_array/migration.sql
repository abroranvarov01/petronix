-- Product: single `subtype` -> multi `subtypes` (tags).

-- 1. New array column.
ALTER TABLE "Product" ADD COLUMN "subtypes" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- 2. Backfill: existing non-empty subtype becomes a one-element array.
UPDATE "Product" SET "subtypes" = ARRAY["subtype"] WHERE "subtype" <> '';

-- Default only needed to add a NOT NULL column to existing rows; drop it now so
-- the column matches the schema (String[] without @default).
ALTER TABLE "Product" ALTER COLUMN "subtypes" DROP DEFAULT;

-- 3. Drop the old composite index and column.
DROP INDEX IF EXISTS "Product_type_subtype_idx";
ALTER TABLE "Product" DROP COLUMN "subtype";

-- 4. GIN index for fast array-containment filtering (subtypes has <slug>).
CREATE INDEX "Product_subtypes_idx" ON "Product" USING GIN ("subtypes");
