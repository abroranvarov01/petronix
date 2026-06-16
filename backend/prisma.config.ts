import { defineConfig } from '@prisma/config';

export default defineConfig({
  schema: './prisma/schema.prisma',
  migrate: {
    url: process.env.DATABASE_URL!,
  },
  // Required by `prisma migrate deploy/status/resolve` (read at runtime/CI).
  datasource: {
    url: process.env.DATABASE_URL!,
  },
} as any);
