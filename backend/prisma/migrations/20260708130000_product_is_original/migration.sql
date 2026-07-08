-- Mark a product as genuine/original — shown as an "Original" badge on the storefront.
ALTER TABLE "Product" ADD COLUMN "isOriginal" BOOLEAN NOT NULL DEFAULT false;
