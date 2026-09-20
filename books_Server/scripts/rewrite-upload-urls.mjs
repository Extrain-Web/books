// ─────────────────────────────────────────────────────────────────────
//  Rewrite absolute upload URLs stored in the database.
//
//  Disk-storage uploads are saved with an ABSOLUTE url built from
//  BACKEND_URL (see src/app/utils/cloudinary.ts → fileToUrl). Move the API
//  to a different host — dev machine → VPS, sslip.io → real domain — and
//  every one of those rows still points at the old host, so the images
//  404 even though the files are right there on the volume.
//
//  This walks every collection, deep-replaces the old base url with the
//  new one in every string it finds, and writes the changed documents back.
//
//  USAGE (from the backend/ folder):
//     node scripts/rewrite-upload-urls.mjs <old-base> <new-base> [--apply]
//
//  Without --apply it only reports what WOULD change (dry run).
//
//  Example — after moving from local dev to the VPS:
//     node scripts/rewrite-upload-urls.mjs http://localhost:5000 https://api.example.com
//     node scripts/rewrite-upload-urls.mjs http://localhost:5000 https://api.example.com --apply
// ─────────────────────────────────────────────────────────────────────
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

const [, , oldBase, newBase, ...rest] = process.argv;
const apply = rest.includes('--apply');

if (!oldBase || !newBase) {
    console.error('Usage: node scripts/rewrite-upload-urls.mjs <old-base> <new-base> [--apply]');
    process.exit(1);
}
if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not set. Run this from the backend/ folder (where .env lives).');
    process.exit(1);
}

const trim = (u) => u.replace(/\/+$/, '');
const OLD = trim(oldBase);
const NEW = trim(newBase);

/** Deep-replace OLD with NEW in every string. Returns [value, replacementCount]. */
function rewrite(value) {
    if (typeof value === 'string') {
        if (!value.includes(OLD)) return [value, 0];
        const count = value.split(OLD).length - 1;
        return [value.split(OLD).join(NEW), count];
    }
    if (Array.isArray(value)) {
        let total = 0;
        const out = value.map((v) => {
            const [nv, n] = rewrite(v);
            total += n;
            return nv;
        });
        return [out, total];
    }
    // Leave ObjectId, Date, Buffer and friends untouched.
    if (value && typeof value === 'object' && value.constructor === Object) {
        let total = 0;
        const out = {};
        for (const [k, v] of Object.entries(value)) {
            const [nv, n] = rewrite(v);
            total += n;
            out[k] = nv;
        }
        return [out, total];
    }
    return [value, 0];
}

async function main() {
    await mongoose.connect(process.env.DATABASE_URL);
    const db = mongoose.connection.db;
    console.log(`ডাটাবেজ : ${db.databaseName}`);
    console.log(`পুরোনো  : ${OLD}`);
    console.log(`নতুন    : ${NEW}`);
    console.log(apply ? 'মোড    : APPLY (লেখা হবে)\n' : 'মোড    : DRY RUN (কিছু লেখা হবে না)\n');

    const collections = (await db.listCollections().toArray()).map((c) => c.name).sort();
    let grandDocs = 0;
    let grandHits = 0;

    for (const name of collections) {
        const col = db.collection(name);
        const docs = await col.find({}).toArray();
        let docsChanged = 0;
        let hits = 0;

        for (const doc of docs) {
            const { _id, ...body } = doc;
            const [rewritten, n] = rewrite(body);
            if (!n) continue;
            hits += n;
            docsChanged++;
            if (apply) await col.replaceOne({ _id }, { _id, ...rewritten });
        }

        if (docsChanged) {
            console.log(`  ${name.padEnd(24)} ${String(docsChanged).padStart(4)} ডকুমেন্ট · ${hits} বার`);
            grandDocs += docsChanged;
            grandHits += hits;
        }
    }

    console.log(`\nমোট: ${grandDocs} ডকুমেন্টে ${grandHits} বার`);
    if (!apply && grandHits) console.log('\n👉 আসলে বদলাতে আবার চালান --apply দিয়ে।');
    if (apply && grandHits) console.log('\n✅ লেখা হয়ে গেছে।');
    if (!grandHits) console.log('কিছু পাওয়া যায়নি — বদলানোর কিছু নাই।');

    await mongoose.disconnect();
}

main().catch((err) => {
    console.error('❌', err.message);
    process.exit(1);
});
