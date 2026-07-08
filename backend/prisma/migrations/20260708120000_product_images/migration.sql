-- A product can now carry a gallery of images shown on the product page.
ALTER TABLE "Product" ADD COLUMN "images" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];

-- Seed the gallery from the existing single image so old products keep their photo.
UPDATE "Product" SET "images" = ARRAY["image"] WHERE "image" <> '';
