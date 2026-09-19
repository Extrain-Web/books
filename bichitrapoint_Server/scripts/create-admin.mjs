// ─────────────────────────────────────────────────────────────────────
//  Create (or update) the first SUPER ADMIN — run once after setting up a
//  new store's database.
//
//  USAGE (from the backend/ folder):
//     node scripts/create-admin.mjs <email> <password> [firstName] [lastName]
//
//  Example:
//     node scripts/create-admin.mjs superadmin@example.com "S0me-Strong-Pass"
//
//  The password is bcrypt-hashed before it is stored. If the email already
//  exists it is promoted to superadmin and the password is reset.
// ─────────────────────────────────────────────────────────────────────
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const [, , email, password, firstName = 'Super', lastName = 'Admin'] = process.argv;

if (!email || !password) {
  console.error('Usage: node scripts/create-admin.mjs <email> <password> [firstName] [lastName]');
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not set. Run this from the backend/ folder (where .env lives).');
  process.exit(1);
}
if (String(password).length < 6) {
  console.error('❌ Password must be at least 6 characters.');
  process.exit(1);
}

await mongoose.connect(process.env.DATABASE_URL);
const users = mongoose.connection.db.collection('users');

const rounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 12;
const hash = await bcrypt.hash(String(password), rounds);
const now = new Date();

const existing = await users.findOne({ email: String(email).toLowerCase() });

if (existing) {
  await users.updateOne(
    { _id: existing._id },
    { $set: { password: hash, role: 'superadmin', status: 'active', isEmailVerified: true, updatedAt: now, passwordChangedAt: new Date(now.getTime() - 2000) } }
  );
  console.log('✅ Updated existing user → superadmin:', email);
} else {
  await users.insertOne({
    email: String(email).toLowerCase(),
    password: hash,
    firstName, lastName,
    phone: '',
    role: 'superadmin',
    permissions: [],
    status: 'active',
    isEmailVerified: true,
    isDeleted: false,
    shippingAddresses: [],
    wishlist: [],
    totalOrders: 0,
    totalSpent: 0,
    createdAt: now,
    updatedAt: now,
  });
  console.log('✅ Created super admin:', email);
}

console.log('   Log in at your storefront /login with this email + password.');
await mongoose.disconnect();
