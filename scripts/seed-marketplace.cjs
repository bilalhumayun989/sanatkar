/*
 * Seed sample marketplace content on the server.
 * Run from the deployed project directory after installing dependencies:
 *   node scripts/seed-marketplace.cjs
 * DATABASE_URL must point at the intended server database.
 * This script is additive and safe to rerun; it does not delete user data.
 */
'use strict';

try { require('dotenv').config(); } catch { /* Server environments can provide DATABASE_URL directly. */ }
const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required. Set it to your server database before running this seed.');
  process.exit(1);
}

const brands = [
  ['Bosch', 'https://logo.clearbit.com/bosch.com', 'German engineering and automotive components.'],
  ['Toyota', 'https://logo.clearbit.com/toyota.com', 'Vehicles and genuine automotive parts.'],
  ['Honda', 'https://logo.clearbit.com/honda.com', 'Cars, motorcycles and replacement parts.'],
  ['Suzuki', 'https://logo.clearbit.com/suzuki.com', 'Popular vehicles and auto parts.'],
  ['Massey Ferguson', 'https://logo.clearbit.com/masseyferguson.com', 'Tractors and agricultural equipment.'],
  ['John Deere', 'https://logo.clearbit.com/deere.com', 'Agricultural machinery and parts.'],
  ['Caterpillar', 'https://logo.clearbit.com/cat.com', 'Heavy equipment and construction machinery.'],
  ['Komatsu', 'https://logo.clearbit.com/komatsu.com', 'Construction and mining equipment.'],
  ['Yamaha', 'https://logo.clearbit.com/yamaha-motor.com', 'Motorcycles, engines and accessories.'],
  ['Shell', 'https://logo.clearbit.com/shell.com', 'Lubricants and automotive fluids.'],
];

const categories = [
  ['Machines', 'Agricultural, industrial and construction machines.', 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?auto=format&fit=crop&w=900&q=80'],
  ['Parts', 'Replacement parts for vehicles and equipment.', 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=900&q=80'],
  ['Attachments', 'Useful attachments and implements for machinery.', 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=900&q=80'],
  ['Tractors', 'New and used tractors for farms and businesses.', 'https://images.unsplash.com/photo-1592982537447-6f2a6a0f0e2b?auto=format&fit=crop&w=900&q=80'],
  ['Cars', 'Cars and passenger vehicles across Pakistan.', 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=900&q=80'],
  ['Motorcycles', 'Motorcycles, scooters and related gear.', 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&w=900&q=80'],
  ['Generators', 'Power generators and backup equipment.', 'https://images.unsplash.com/photo-1473341304170-971833f6a531?auto=format&fit=crop&w=900&q=80'],
  ['Tools', 'Workshop, farm and construction tools.', 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=80'],
  ['Tyres', 'Tyres and wheels for vehicles and machinery.', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=900&q=80'],
  ['Others', 'Additional equipment and marketplace items.', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=80'],
];

const shops = [
  { id: 'a0000000-0000-4000-8000-000000000001', name: 'Lahore Tractor House', username: 'lahore_tractor_house', city: 'Lahore', phone: '+923001110001', image: 'https://images.unsplash.com/photo-1530267981375-f0de937f5f13?auto=format&fit=crop&w=1200&q=80', description: 'Quality tractors, implements and farm machinery from trusted brands.' },
  { id: 'a0000000-0000-4000-8000-000000000002', name: 'Karachi Auto Parts', username: 'karachi_auto_parts', city: 'Karachi', phone: '+923001110002', image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?auto=format&fit=crop&w=1200&q=80', description: 'Genuine and inspected parts for cars, bikes and commercial vehicles.' },
  { id: 'a0000000-0000-4000-8000-000000000003', name: 'Islamabad Machinery Mart', username: 'islamabad_machinery_mart', city: 'Islamabad', phone: '+923001110003', image: 'https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1200&q=80', description: 'Construction equipment, workshop tools and machinery attachments.' },
  { id: 'a0000000-0000-4000-8000-000000000004', name: 'Faisalabad Farm Supply', username: 'faisalabad_farm_supply', city: 'Faisalabad', phone: '+923001110004', image: 'https://images.unsplash.com/photo-1592982537447-6f2a6a0f0e2b?auto=format&fit=crop&w=1200&q=80', description: 'Reliable farm equipment, irrigation supplies and tractor parts.' },
  { id: 'a0000000-0000-4000-8000-000000000005', name: 'Rawalpindi Auto Hub', username: 'rawalpindi_auto_hub', city: 'Rawalpindi', phone: '+923001110005', image: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=1200&q=80', description: 'Carefully inspected cars, motorcycles and everyday automotive essentials.' },
];

const products = [
  { shop: 0, title: 'Massey Ferguson 385 Tractor', brand: 'Massey Ferguson', model: '385 2WD', category: 'tractors', price: 4850000, year: '2021', condition: 'Used', featured: true, image: 'photo-1530267981375-f0de937f5f13' },
  { shop: 0, title: 'Heavy Duty Disc Harrow', brand: 'John Deere', model: 'HD-16', category: 'attachments', price: 385000, year: '2024', condition: 'New', featured: true, image: 'photo-1581092160562-40aa08e78837' },
  { shop: 1, title: 'Toyota Corolla Genuine Brake Kit', brand: 'Toyota', model: 'Corolla 2019-2023', category: 'parts', price: 42500, year: '2024', condition: 'New', featured: true, image: 'photo-1486262715619-67b85e0b08d3' },
  { shop: 2, title: 'Caterpillar Mini Excavator', brand: 'Caterpillar', model: '301.7 CR', category: 'machines', price: 7850000, year: '2022', condition: 'Used', featured: true, image: 'photo-1581092160562-40aa08e78837' },
  { shop: 4, title: 'Honda CG 125 Motorcycle', brand: 'Honda', model: 'CG 125', category: 'motorcycles', price: 285000, year: '2023', condition: 'Used', featured: true, image: 'photo-1558981806-ec527fa84c39' },
  { shop: 1, title: 'Bosch Car Battery 12V', brand: 'Bosch', model: 'S4 60Ah', category: 'parts', price: 28500, year: '2025', condition: 'New', featured: false, image: 'photo-1486262715619-67b85e0b08d3' },
  { shop: 3, title: 'Tractor PTO Shaft', brand: 'Massey Ferguson', model: '540 RPM', category: 'parts', price: 18500, year: '2024', condition: 'New', featured: false, image: 'photo-1581092160562-40aa08e78837' },
  { shop: 2, title: 'Portable Diesel Generator 8kVA', brand: 'Caterpillar', model: 'DG-8000', category: 'generators', price: 325000, year: '2024', condition: 'New', featured: false, image: 'photo-1473341304170-971833f6a531' },
  { shop: 4, title: 'Suzuki Alto VXL', brand: 'Suzuki', model: 'Alto VXL AGS', category: 'cars', price: 2650000, year: '2022', condition: 'Used', featured: false, image: 'photo-1492144534655-ae79c964c9d7' },
  { shop: 3, title: 'Agricultural Water Pump', brand: 'Honda', model: 'WB30', category: 'machines', price: 68500, year: '2024', condition: 'New', featured: false, image: 'photo-1530267981375-f0de937f5f13' },
  { shop: 2, title: 'Workshop Tool Set 120 Piece', brand: 'Bosch', model: 'Professional Set', category: 'tools', price: 42500, year: '2025', condition: 'New', featured: false, image: 'photo-1504148455328-c376907d081c' },
  { shop: 1, title: 'Yokohama Commercial Tyre', brand: 'Yamaha', model: '245/70 R16', category: 'tyres', price: 38500, year: '2025', condition: 'New', featured: false, image: 'photo-1558618666-fcd25c85cd64' },
  { shop: 4, title: 'Shell Helix Engine Oil 4L', brand: 'Shell', model: 'HX7 10W-40', category: 'others', price: 8900, year: '2025', condition: 'New', featured: false, image: 'photo-1486262715619-67b85e0b08d3' },
];

const imageUrl = (photo) => `https://images.unsplash.com/${photo}?auto=format&fit=crop&w=1200&q=85`;

async function main() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 2, connectionTimeoutMillis: 15000 });
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    for (const [name, logoUrl, description] of brands) {
      const existing = await client.query('SELECT id FROM brands WHERE lower(name) = lower($1) LIMIT 1', [name]);
      if (existing.rowCount) await client.query('UPDATE brands SET logo_url=$2, description=$3, is_active=true WHERE id=$1', [existing.rows[0].id, logoUrl, description]);
      else await client.query('INSERT INTO brands (name, logo_url, description, is_active) VALUES ($1,$2,$3,true)', [name, logoUrl, description]);
    }
    for (const [name, description, image] of categories) {
      const existing = await client.query('SELECT id FROM categories WHERE lower(name) = lower($1) LIMIT 1', [name]);
      if (existing.rowCount) await client.query('UPDATE categories SET description=$2, image_url=$3, is_active=true, is_popular=true WHERE id=$1', [existing.rows[0].id, description, image]);
      else await client.query('INSERT INTO categories (name, description, image_url, is_active, is_popular) VALUES ($1,$2,$3,true,true)', [name, description, image]);
    }

    for (const shop of shops) {
      await client.query(`INSERT INTO profiles
        (id, username, email, role, phone, full_name, seller_status, seller_activation_status, shop_name, shop_description, shop_address, city, shop_image_url, verification_status, total_listings_posted, onboarding_complete)
        VALUES ($1::uuid,$2,$3,'seller',$4,$5,'approved','approved',$5,$6,$7,$8,$9,'verified',0,true)
        ON CONFLICT (id) DO UPDATE SET username=EXCLUDED.username, role='seller', seller_status='approved', seller_activation_status='approved', shop_name=EXCLUDED.shop_name, shop_description=EXCLUDED.shop_description, shop_address=EXCLUDED.shop_address, city=EXCLUDED.city, shop_image_url=EXCLUDED.shop_image_url, verification_status='verified', onboarding_complete=true`,
      [shop.id, shop.username, `${shop.username}@seed.sanatkar.invalid`, shop.phone, shop.name, shop.description, `${shop.city}, Pakistan`, shop.city, shop.image]);
    }

    for (const product of products) {
      const shop = shops[product.shop];
      const images = [imageUrl(product.image)];
      await client.query(`INSERT INTO listings
        (title, price, location, image_urls, year, brand, category, description, condition, seller_id, status, model, origin, stock_status, phone_number, contact_option, is_featured)
        SELECT $1,$2,$3,$4::text[],$5,$6,$7,$8,$9,$10::uuid,'active',$11,'Pakistan','In Stock',$12,'phone', $13
        WHERE NOT EXISTS (SELECT 1 FROM listings WHERE seller_id=$10::uuid AND title=$1)`,
      [product.title, product.price, shop.city, images, product.year, product.brand, product.category,
        `${product.title}. ${product.condition === 'New' ? 'Brand new' : 'Inspected and in good working condition'}. Available from ${shop.name} in ${shop.city}, Pakistan. Contact the shop to confirm availability and arrange viewing.`,
        product.condition, shop.id, product.model, shop.phone, product.featured]);
    }
    for (const shop of shops) {
      await client.query(`UPDATE profiles SET total_listings_posted = (
        SELECT count(*)::int FROM listings WHERE seller_id = $1::uuid
      ) WHERE id = $1::uuid`, [shop.id]);
    }
    await client.query('COMMIT');
    console.log(`Seed complete: ${brands.length} brands, ${categories.length} categories, ${shops.length} shops, ${products.filter(p => p.featured).length} featured products, ${products.filter(p => !p.featured).length} standard products.`);
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch((error) => {
  console.error('Marketplace seed failed:', error.message);
  process.exitCode = 1;
});
