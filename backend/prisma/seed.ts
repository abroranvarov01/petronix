// Bootstrap the first ADMIN account from env vars.
// Run once after deploy:
//   ADMIN_EMAIL=you@example.com ADMIN_PASSWORD='strong-pass' npx tsx prisma/seed.ts
// Safe to re-run: it only creates the admin if that email does not exist yet.
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

async function main() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) {
    console.error('Set ADMIN_EMAIL and ADMIN_PASSWORD env vars to seed an admin.');
    process.exit(1);
  }

  const connectionString = process.env.DATABASE_URL;
  const adapter = new PrismaPg(new Pool({ connectionString }));
  const prisma = new PrismaClient({ adapter });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`User ${email} already exists (role=${existing.role}) — nothing to do.`);
  } else {
    const hash = await bcrypt.hash(password, 10);
    await prisma.user.create({ data: { email, password: hash, name: 'Administrator', role: 'ADMIN' } });
    console.log(`Created ADMIN: ${email}`);
  }
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
