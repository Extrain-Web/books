import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('❌ DATABASE_URL is not defined in backend/.env');
  process.exit(1);
}

const jsonPath = path.join(__dirname, '..', 'data', 'seed-data.json');
if (!fs.existsSync(jsonPath)) {
  console.error(`❌ JSON data file not found at: ${jsonPath}`);
  process.exit(1);
}

const seedData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

async function seed() {
  console.log('🔌 Connecting to MongoDB...');
  await mongoose.connect(dbUrl);
  console.log('✅ Connected to MongoDB:', mongoose.connection.name);

  const db = mongoose.connection.db;

  const usersCol = db.collection('users');
  const categoriesCol = db.collection('categories');
  const productsCol = db.collection('products');
  const couponsCol = db.collection('coupons');
  const shippingSettingsCol = db.collection('shippingsettings');
  const shippingZonesCol = db.collection('shippingzones');
  const shippingRatesCol = db.collection('shippingrates');

  const now = new Date();
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

  // ── 1. Seed Users ──────────────────────────────────────────────────
  console.log('\n👤 Seeding Users...');
  for (const user of seedData.users || []) {
    const existing = await usersCol.findOne({ email: user.email.toLowerCase() });
    const hashedPassword = await bcrypt.hash(user.password, saltRounds);

    const doc = {
      email: user.email.toLowerCase(),
      password: hashedPassword,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      role: user.role || 'user',
      permissions: user.permissions || [],
      status: user.status || 'active',
      isEmailVerified: user.isEmailVerified ?? true,
      isDeleted: false,
      shippingAddresses: (user.shippingAddresses || []).map((addr) => ({
        ...addr,
        _id: new mongoose.Types.ObjectId(),
      })),
      wishlist: [],
      totalOrders: 0,
      totalSpent: 0,
      updatedAt: now,
    };

    if (existing) {
      await usersCol.updateOne({ _id: existing._id }, { $set: doc });
      console.log(`   🔄 Updated user: ${user.email} (${user.role})`);
    } else {
      doc.createdAt = now;
      await usersCol.insertOne(doc);
      console.log(`   ✨ Created user: ${user.email} (${user.role})`);
    }
  }

  // ── 2. Seed Categories ─────────────────────────────────────────────
  console.log('\n📁 Seeding Categories...');
  const categoryMap = new Map(); // slug -> _id

  for (const cat of seedData.categories || []) {
    const existing = await categoriesCol.findOne({ slug: cat.slug });
    const doc = {
      name: cat.name,
      slug: cat.slug,
      description: cat.description || '',
      icon: cat.icon || '',
      image: cat.image || '',
      banner: cat.banner || '',
      parent: null,
      level: 0,
      order: cat.order || 0,
      isActive: true,
      isFeatured: cat.isFeatured ?? false,
      showInMenu: cat.showInMenu ?? true,
      showInHome: cat.showInHome ?? true,
      isDeleted: false,
      updatedAt: now,
    };

    let catId;
    if (existing) {
      await categoriesCol.updateOne({ _id: existing._id }, { $set: doc });
      catId = existing._id;
      console.log(`   🔄 Updated category: ${cat.name} (${cat.slug})`);
    } else {
      doc.createdAt = now;
      doc.productCount = 0;
      const res = await categoriesCol.insertOne(doc);
      catId = res.insertedId;
      console.log(`   ✨ Created category: ${cat.name} (${cat.slug})`);
    }
    categoryMap.set(cat.slug, catId);
  }

  // ── 3. Seed Products ───────────────────────────────────────────────
  console.log('\n🛍️ Seeding Products...');
  let productCount = 0;

  for (const prod of seedData.products || []) {
    const catId = categoryMap.get(prod.categorySlug);
    if (!catId) {
      console.warn(`   ⚠️ Skipping product "${prod.name}": Category "${prod.categorySlug}" not found`);
      continue;
    }

    const existing = await productsCol.findOne({ slug: prod.slug });

    const originalPrice = prod.originalPrice || prod.price;
    const discount = originalPrice > prod.price 
      ? Math.round(((originalPrice - prod.price) / originalPrice) * 100)
      : 0;

    const doc = {
      name: prod.name,
      slug: prod.slug,
      sku: prod.sku || '',
      description: prod.description,
      tagline: prod.tagline || 'Lower price than others but quality higher',
      priceType: prod.priceType || 'fixed',
      productType: prod.productType || (prod.variants?.length ? 'variable' : 'simple'),
      price: prod.price,
      originalPrice: originalPrice,
      wholesalePrice: prod.wholesalePrice ?? null,
      discount: discount,
      costPrice: prod.costPrice || 0,
      thumbnail: prod.thumbnail,
      images: prod.images || [prod.thumbnail],
      category: catId,
      subCategory: null,
      brand: prod.brand || '',
      model: prod.model || '',
      weight: prod.weight || '',
      unit: prod.unit || 'piece',
      stock: prod.stock ?? 50,
      lowStockThreshold: 5,
      status: 'active',
      visibility: 'visible',
      isDeleted: false,
      isFeatured: prod.isFeatured ?? false,
      isOnSale: prod.isOnSale ?? false,
      isBestSelling: prod.isBestSelling ?? false,
      isNewProduct: prod.isNewProduct ?? true,
      tags: prod.tags || [],
      specifications: prod.specifications || [],
      highlights: prod.highlights || [],
      variants: (prod.variants || []).map((v) => ({
        ...v,
        _id: new mongoose.Types.ObjectId(),
      })),
      codAvailable: true,
      rating: prod.rating || 5.0,
      reviewCount: prod.reviewCount || 0,
      totalSold: prod.totalSold || 0,
      viewCount: Math.floor(Math.random() * 200) + 50,
      likeCount: Math.floor(Math.random() * 30) + 5,
      updatedAt: now,
    };

    if (existing) {
      await productsCol.updateOne({ _id: existing._id }, { $set: doc });
      console.log(`   🔄 Updated product: ${prod.name} (৳${prod.price})`);
    } else {
      doc.createdAt = now;
      await productsCol.insertOne(doc);
      console.log(`   ✨ Created product: ${prod.name} (৳${prod.price})`);
    }
    productCount++;
  }

  // Update category productCounts
  for (const [slug, id] of categoryMap.entries()) {
    const count = await productsCol.countDocuments({ category: id, isDeleted: false, status: 'active' });
    await categoriesCol.updateOne({ _id: id }, { $set: { productCount: count } });
  }

  // ── 4. Seed Coupons ────────────────────────────────────────────────
  console.log('\n🎟️ Seeding Coupons...');
  for (const cp of seedData.coupons || []) {
    const existing = await couponsCol.findOne({ code: cp.code.toUpperCase() });
    const doc = {
      code: cp.code.toUpperCase(),
      description: cp.description || '',
      discountType: cp.discountType || 'percentage',
      discountValue: cp.discountValue,
      maxDiscount: cp.maxDiscount || null,
      minOrderAmount: cp.minOrderAmount || 0,
      usageLimit: cp.usageLimit || null,
      usedCount: 0,
      expiresAt: new Date(cp.expiresAt),
      isActive: cp.isActive ?? true,
      applicableTo: cp.applicableTo || 'all',
      specificProducts: [],
      specificCategories: [],
      updatedAt: now,
    };

    if (existing) {
      await couponsCol.updateOne({ _id: existing._id }, { $set: doc });
      console.log(`   🔄 Updated coupon: ${cp.code}`);
    } else {
      doc.createdAt = now;
      await couponsCol.insertOne(doc);
      console.log(`   ✨ Created coupon: ${cp.code}`);
    }
  }

  // ── 5. Seed Shipping ───────────────────────────────────────────────
  console.log('\n🚚 Seeding Shipping Configurations...');
  if (seedData.shipping?.settings) {
    const st = seedData.shipping.settings;
    await shippingSettingsCol.updateOne(
      { _key: 'main' },
      {
        $set: {
          _key: 'main',
          freeShippingThreshold: st.freeShippingThreshold || 1499,
          freeShippingByThresholdEnabled: st.freeShippingByThresholdEnabled ?? true,
          defaultInsideDhakaRate: st.defaultInsideDhakaRate || 60,
          defaultOutsideDhakaRate: st.defaultOutsideDhakaRate || 120,
          defaultEstimatedDays: st.defaultEstimatedDays || '2-4 days',
          quantityFreeShippingEnabled: false,
          minItemsForFreeShipping: 0,
          defaultCommissionRate: 10,
          updatedAt: now,
        },
        $setOnInsert: { createdAt: now },
      },
      { upsert: true }
    );
    console.log('   ✅ Global shipping settings configured');
  }

  if (seedData.shipping?.zones) {
    for (const z of seedData.shipping.zones) {
      let zoneDoc = await shippingZonesCol.findOne({ name: z.name });
      if (!zoneDoc) {
        const res = await shippingZonesCol.insertOne({
          name: z.name,
          regions: z.regions || [],
          isActive: true,
          createdAt: now,
          updatedAt: now,
        });
        zoneDoc = { _id: res.insertedId };
      }

      if (z.rate) {
        await shippingRatesCol.updateOne(
          { zone: zoneDoc._id },
          {
            $set: {
              name: z.rate.name,
              zone: zoneDoc._id,
              minWeight: z.rate.minWeight || 0,
              maxWeight: z.rate.maxWeight || 999,
              price: z.rate.price,
              freeShippingMinimum: z.rate.freeShippingMinimum || 0,
              estimatedDays: z.rate.estimatedDays || '2-4 days',
              isActive: true,
              updatedAt: now,
            },
            $setOnInsert: { createdAt: now },
          },
          { upsert: true }
        );
      }
      console.log(`   ✅ Shipping zone & rate: ${z.name}`);
    }
  }

  // ── 6. Seed Wholesale Customers & Demo Order ───────────────────────
  console.log('\n🏢 Seeding Wholesale Customers...');
  const wholesaleCustomersCol = db.collection('wholesalecustomers');
  const wholesaleOrdersCol = db.collection('wholesaleorders');

  const customerList = [];
  for (const c of seedData.wholesaleCustomers || []) {
    const existing = await wholesaleCustomersCol.findOne({ phone: c.phone });
    const doc = {
      businessName: c.businessName,
      contactName: c.contactName || '',
      phone: c.phone,
      email: c.email || '',
      address: c.address,
      city: c.city || 'Dhaka',
      customerType: c.customerType || 'Book Shop',
      openingBalance: c.openingBalance || 0,
      totalOrders: c.totalOrders || 0,
      totalBilled: c.totalBilled || 0,
      totalPaid: c.totalPaid || 0,
      currentDue: c.currentDue || c.openingBalance || 0,
      notes: c.notes || '',
      isActive: true,
      isDeleted: false,
      updatedAt: now,
    };

    let cId;
    if (existing) {
      await wholesaleCustomersCol.updateOne({ _id: existing._id }, { $set: doc });
      cId = existing._id;
      console.log(`   🔄 Updated wholesale customer: ${c.businessName} (${c.customerType})`);
    } else {
      doc.createdAt = now;
      const res = await wholesaleCustomersCol.insertOne(doc);
      cId = res.insertedId;
      console.log(`   ✨ Created wholesale customer: ${c.businessName} (${c.customerType})`);
    }
    customerList.push({ ...doc, _id: cId });
  }

  // Create sample wholesale order if none exists
  const existingOrder = await wholesaleOrdersCol.findOne();
  if (!existingOrder && customerList.length > 0) {
    const sampleCustomer = customerList[0];
    const ajwaProduct = await productsCol.findOne({ slug: 'premium-madinah-ajwa-dates-500g' });
    const attarProduct = await productsCol.findOne({ slug: 'royal-arabian-bakhoor-oudh-attar-12ml' });

    if (ajwaProduct && attarProduct) {
      const items = [
        {
          _id: new mongoose.Types.ObjectId(),
          product: ajwaProduct._id,
          name: ajwaProduct.name,
          sku: ajwaProduct.sku || '',
          thumbnail: ajwaProduct.thumbnail || '',
          variantLabel: '',
          quantity: 20,
          unitPrice: ajwaProduct.wholesalePrice || 980,
          retailPrice: ajwaProduct.price,
          total: 20 * (ajwaProduct.wholesalePrice || 980),
        },
        {
          _id: new mongoose.Types.ObjectId(),
          product: attarProduct._id,
          name: attarProduct.name,
          sku: attarProduct.sku || '',
          thumbnail: attarProduct.thumbnail || '',
          variantLabel: '',
          quantity: 30,
          unitPrice: attarProduct.wholesalePrice || 420,
          retailPrice: attarProduct.price,
          total: 30 * (attarProduct.wholesalePrice || 420),
        },
      ];

      const subtotal = items.reduce((sum, item) => sum + item.total, 0);
      const discount = 500;
      const deliveryCharge = 200;
      const grandTotal = subtotal - discount + deliveryCharge;
      const paidAmount = 25000;
      const dueAmount = grandTotal - paidAmount;

      const orderDoc = {
        invoiceNumber: 'WS-2026-0001',
        customer: sampleCustomer._id,
        customerSnapshot: {
          businessName: sampleCustomer.businessName,
          contactName: sampleCustomer.contactName,
          phone: sampleCustomer.phone,
          email: sampleCustomer.email,
          address: sampleCustomer.address,
          city: sampleCustomer.city,
          customerType: sampleCustomer.customerType,
        },
        items,
        subtotal,
        discount,
        deliveryCharge,
        grandTotal,
        paidAmount,
        dueAmount,
        paymentStatus: 'partial',
        orderStatus: 'confirmed',
        paymentMethod: 'bank_transfer',
        paymentTerms: 'Payment due within 15 days of invoice date.',
        returnPolicy: 'Damaged or defective goods must be notified within 48 hours of delivery.',
        notes: 'Monthly bulk supply order for Banglabazar book shop branch',
        orderDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        createdAt: now,
        updatedAt: now,
      };

      await wholesaleOrdersCol.insertOne(orderDoc);
      await wholesaleCustomersCol.updateOne(
        { _id: sampleCustomer._id },
        {
          $set: {
            totalOrders: 1,
            totalBilled: grandTotal,
            totalPaid: paidAmount,
            currentDue: dueAmount,
          },
        }
      );
      console.log(`   ✨ Created demo wholesale order & invoice: WS-2026-0001 (Grand Total: ৳${grandTotal})`);
    }
  }

  console.log('\n🎉 ==============================================');
  console.log('   Demo JSON data successfully seeded into MongoDB!');
  console.log('================================================\n');

  console.log('🔑 Demo Login Credentials:');
  console.log('   Super Admin: superadmin@example.com  |  Pass: Password123!');
  console.log('   Admin:       admin@example.com       |  Pass: Password123!');
  console.log('   Customer:    customer@example.com    |  Pass: Password123!');
  console.log('');

  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error('❌ Error seeding data:', err);
  process.exit(1);
});
