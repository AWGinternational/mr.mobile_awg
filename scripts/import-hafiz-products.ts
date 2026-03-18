import { PrismaClient } from '@/generated/prisma';

const prisma = new PrismaClient();

// Product data from the attachment
const productData = [
  { stockQty: 1, brand: 'Generic', category: 'Microphone', model: 'Microphone N-08', costPrice: 900, sellingPrice: 2500 },
  { stockQty: 5, brand: 'Generic', category: 'Speaker', model: 'Bluetooth Sport Wireless M', costPrice: 900, sellingPrice: 2000 },
  { stockQty: 1, brand: 'Generic', category: 'Wireless Mouse', model: 'Wireless M', costPrice: 900, sellingPrice: 2500 },
  { stockQty: 6, brand: 'Vblu', category: 'Earphone', model: 'V23', costPrice: 300, sellingPrice: 800 },
  { stockQty: 6, brand: 'Vblu', category: 'Earphone', model: 'V23', costPrice: 300, sellingPrice: 800 },
  { stockQty: 3, brand: 'iconix', category: 'Cable', model: 'GC-09', costPrice: 200, sellingPrice: 400 },
  { stockQty: 3, brand: 'iconix', category: 'Cable', model: 'GC-09', costPrice: 200, sellingPrice: 400 },
  { stockQty: 3, brand: 'iconix', category: 'Charger', model: 'WC-50', costPrice: 400, sellingPrice: 1000 },
  { stockQty: 3, brand: 'iconix', category: 'Charger', model: 'WC-50', costPrice: 400, sellingPrice: 1000 },
  { stockQty: 1, brand: 'Mee', category: 'Headset', model: 'C-07', costPrice: 250, sellingPrice: 700 },
  { stockQty: 2, brand: 'Onex', category: 'Charger', model: 'C-07', costPrice: 250, sellingPrice: 700 },
  { stockQty: 2, brand: 'Onex', category: 'Cable', model: 'Micro Cable', costPrice: 200, sellingPrice: 600 },
  { stockQty: 3, brand: 'Generic', category: 'Wireless Mouse', model: 'Wireless M', costPrice: 1000, sellingPrice: 2500 },
  { stockQty: 3, brand: 'Generic', category: 'Wireless Ev', model: 'Wireless Ev', costPrice: 1000, sellingPrice: 2500 },
  { stockQty: 2, brand: 'RT', category: 'Earphone', model: 'RT Flex 1', costPrice: 1800, sellingPrice: 3500 },
  { stockQty: 2, brand: 'ioniq', category: 'Earphone', model: 'RANG45-With Wireless Ev', costPrice: 2200, sellingPrice: 5000 },
  { stockQty: 1, brand: 'BLT', category: 'Power Ban', model: 'Power Ban BLT', costPrice: 1400, sellingPrice: 3500 },
  { stockQty: 3, brand: 'Power Ban', category: 'Power Ban', model: 'S4', costPrice: 1400, sellingPrice: 3500 },
  { stockQty: 2, brand: 'NT Super', category: 'Power Ban', model: 'Power Ban 10W', costPrice: 1000, sellingPrice: 2000 },
  { stockQty: 1, brand: 'Mi', category: 'Headset', model: 'Super Fast 18W', costPrice: 1700, sellingPrice: 3500 },
  { stockQty: 1, brand: 'Generic', category: 'Memory Car', model: 'Memory Car', costPrice: 600, sellingPrice: 2000 },
  { stockQty: 1, brand: 'Generic', category: 'Speaker', model: 'STR-2069 Wireless Sp', costPrice: 1300, sellingPrice: 3500 },
  { stockQty: 1, brand: 'Generic', category: 'Speaker', model: 'R-T-70A Blue', costPrice: 1500, sellingPrice: 4000 },
  { stockQty: 1, brand: 'Generic', category: 'Speaker', model: 'GC-1', costPrice: 1400, sellingPrice: 3200 },
  { stockQty: 1, brand: 'Generic', category: 'Speaker', model: 'BM-12', costPrice: 1400, sellingPrice: 3500 },
  { stockQty: 1, brand: 'Tronic', category: 'Charger', model: 'Double Mic', costPrice: 1000, sellingPrice: 2500 },
  { stockQty: 1, brand: 'iconix', category: 'Cable', model: 'MT-304', costPrice: 200, sellingPrice: 500 },
  { stockQty: 7, brand: 'iconix', category: 'Charger', model: 'MT-304', costPrice: 200, sellingPrice: 700 },
  { stockQty: 7, brand: 'Super Ban', category: 'Handsfree', model: 'SK-104', costPrice: 130, sellingPrice: 450 },
  { stockQty: 3, brand: 'Super Ban', category: 'Handsfree', model: 'SK-104', costPrice: 130, sellingPrice: 450 },
  { stockQty: 1, brand: 'Mee', category: 'Headset', model: 'C-07', costPrice: 250, sellingPrice: 700 },
  { stockQty: 1, brand: 'Mee', category: 'Headset', model: 'Max', costPrice: 600, sellingPrice: 1800 },
  { stockQty: 1, brand: 'RT', category: 'Earphone', model: 'RT Flex 1', costPrice: 2300, sellingPrice: 4300 },
  { stockQty: 1, brand: 'RM', category: 'Charger', model: 'Real Type 18W USB 1', costPrice: 450, sellingPrice: 1500 },
  { stockQty: 3, brand: 'Onex', category: 'Charger', model: 'Real Type', costPrice: 450, sellingPrice: 1200 },
  { stockQty: 2, brand: 'Onex', category: 'Charger', model: 'Type C', costPrice: 600, sellingPrice: 1200 },
  { stockQty: 1, brand: 'Generic', category: 'Car Charger', model: 'Car Charger 008', costPrice: 400, sellingPrice: 1100 },
  { stockQty: 3, brand: 'iconix', category: 'Charger', model: 'Car Charger 008', costPrice: 400, sellingPrice: 1100 },
  { stockQty: 1, brand: 'iconix', category: 'Power Ban', model: 'Power Ban PB-12K', costPrice: 2800, sellingPrice: 5000 },
  { stockQty: 2, brand: 'iconix', category: 'Power Ban', model: 'Power Ban PB-12K', costPrice: 2800, sellingPrice: 5000 },
  { stockQty: 1, brand: 'MM', category: 'Power Ban', model: 'Power Ban 50000', costPrice: 2000, sellingPrice: 4000 },
  { stockQty: 2, brand: 'iconix', category: 'Power Ban', model: 'Power Ban 50000', costPrice: 900, sellingPrice: 2000 },
  { stockQty: 1, brand: 'Generic', category: 'Cooling Fan', model: 'Cooling Fan AD1', costPrice: 1900, sellingPrice: 3000 },
  { stockQty: 1, brand: 'Generic', category: 'Phone Stand', model: 'Phone Stand', costPrice: 700, sellingPrice: 2000 },
  { stockQty: 3, brand: 'VBU', category: 'Earphone', model: 'V-23', costPrice: 600, sellingPrice: 1200 },
  { stockQty: 5, brand: 'ioniq', category: 'Earphone', model: 'LE-85', costPrice: 600, sellingPrice: 1500 },
  { stockQty: 2, brand: 'Onex', category: 'Charger', model: 'X-37', costPrice: 150, sellingPrice: 500 },
  { stockQty: 1, brand: 'Onex', category: 'Earphone', model: 'X-28', costPrice: 150, sellingPrice: 400 },
  { stockQty: 4, brand: 'Onex', category: 'Handsfree', model: 'M-11', costPrice: 100, sellingPrice: 400 },
  { stockQty: 4, brand: 'Onex', category: 'Handsfree', model: 'M-11', costPrice: 100, sellingPrice: 400 },
  { stockQty: 3, brand: 'Generic', category: 'Handsfree', model: 'GH-03', costPrice: 210, sellingPrice: 700 },
  { stockQty: 3, brand: 'Generic', category: 'Handsfree', model: 'GH-03', costPrice: 210, sellingPrice: 700 },
  { stockQty: 3, brand: 'Generic', category: 'Handsfree', model: 'GH-10', costPrice: 240, sellingPrice: 800 },
  { stockQty: 3, brand: 'Mee', category: 'Charger', model: 'Super Fast 18w Fast', costPrice: 600, sellingPrice: 1500 },
  { stockQty: 3, brand: 'Generic', category: 'Charger', model: 'Real Type', costPrice: 220, sellingPrice: 700 },
  { stockQty: 3, brand: 'Onex', category: 'Cable', model: 'GC-09', costPrice: 200, sellingPrice: 500 },
  { stockQty: 3, brand: 'Onex', category: 'Cable', model: 'GC-09', costPrice: 200, sellingPrice: 500 },
  { stockQty: 2, brand: 'Onex', category: 'Charger', model: 'GC-09', costPrice: 250, sellingPrice: 700 },
  { stockQty: 2, brand: 'Onex', category: 'Charger', model: 'C-07', costPrice: 250, sellingPrice: 700 },
  { stockQty: 3, brand: 'Onex', category: 'Charger', model: 'C-15', costPrice: 300, sellingPrice: 850 },
  { stockQty: 1, brand: 'Mee', category: 'Charger', model: 'Type C Ch.', costPrice: 400, sellingPrice: 1000 },
  { stockQty: 3, brand: 'iconix', category: 'Cable', model: 'Double M.', costPrice: 250, sellingPrice: 700 },
  { stockQty: 3, brand: 'iconix', category: 'Cable', model: '2ld-BT', costPrice: 250, sellingPrice: 800 },
  { stockQty: 1, brand: 'Mee', category: 'Cable', model: 'Phone In 1', costPrice: 500, sellingPrice: 1000 },
  { stockQty: 5, brand: 'Tg Power', category: 'Handsfree', model: 'TI-BT-SK Handsfree', costPrice: 120, sellingPrice: 500 },
  { stockQty: 7, brand: 'Vblu', category: 'Earphone', model: 'Vx2', costPrice: 120, sellingPrice: 450 },
  { stockQty: 1, brand: 'Mee', category: 'Headset', model: 'Max', costPrice: 600, sellingPrice: 1800 },
  { stockQty: 1, brand: 'Mee', category: 'Headset', model: 'Wireless St', costPrice: 600, sellingPrice: 1800 },
  { stockQty: 1, brand: 'ioniq', category: 'Earphone', model: 'LE-85', costPrice: 1000, sellingPrice: 2500 },
  { stockQty: 21, brand: 'BT Power', category: 'Charger', model: 'Super Fast Super Fast', costPrice: 300, sellingPrice: 900 },
  { stockQty: 1, brand: 'RT', category: 'Earphone', model: 'RT Flex 1', costPrice: 1800, sellingPrice: 3500 },
  { stockQty: 1, brand: 'RM', category: 'Handsfree', model: 'RM Handsfree', costPrice: 120, sellingPrice: 450 },
  { stockQty: 4, brand: 'Onc Power', category: 'Charger', model: 'CM-23', costPrice: 400, sellingPrice: 900 },
  { stockQty: 5, brand: 'Ronex', category: 'Charger', model: 'Ronex', costPrice: 350, sellingPrice: 1000 },
  { stockQty: 3, brand: 'Generic', category: 'Car Charger', model: 'Car Charger 008', costPrice: 400, sellingPrice: 1100 },
  { stockQty: 2, brand: 'SANTOSH', category: 'Power Ban', model: 'Power Ban PB-12K', costPrice: 2800, sellingPrice: 5000 },
  { stackQty: 1, brand: 'BLT', category: 'Power Ban', model: 'Power Ban PB-12K', costPrice: 2800, sellingPrice: 5000 },
  { stockQty: 1, brand: 'Generic', category: 'Wireless', model: 'Wireless M', costPrice: 1000, sellingPrice: 2500 },
  { stockQty: 3, brand: 'Generic', category: 'Wireless EV-1', model: 'Wireless Ev', costPrice: 1800, sellingPrice: 3500 },
  { stockQty: 18, brand: 'RT', category: 'Earphone', model: 'RT Flex', costPrice: 2000, sellingPrice: 4000 },
  { stockQty: 20, brand: 'BLT', category: 'Handsfree', model: 'D13', costPrice: 300, sellingPrice: 800 },
  { stockQty: 18, brand: 'RT', category: 'Earphone', model: 'RT Flex1', costPrice: 2000, sellingPrice: 3500 },
  { stockQty: 3, brand: 'BLT', category: 'Cable', model: 'Lightning-03', costPrice: 200, sellingPrice: 600 },
  { stockQty: 2, brand: 'BLT', category: 'Handsfree', model: 'WS-BL-03', costPrice: 1800, sellingPrice: 3500 },
  { stockQty: 1, brand: 'Generic', category: 'Speaker', model: 'GC-1', costPrice: 1500, sellingPrice: 4000 },
  { stockQty: 3, brand: 'Jhonson', category: 'Wireless EJ', model: 'Wireless EJ Jh-R02B PAM2 TWS', costPrice: 2000, sellingPrice: 3500 },
  { stockQty: 3, brand: 'Jhonson', category: 'Wireless EJ', model: 'Wireless EJ Jh-R02 PAM2 TWS', costPrice: 2000, sellingPrice: 3500 },
  { stockQty: 2, brand: 'Apple-Style', category: 'Wireless Airpods', model: 'Wireless Airpods Pro Airpods Pro', costPrice: 2000, sellingPrice: 4500 },
  { stockQty: 1, brand: 'Apple-Style', category: 'Wireless Airpods', model: 'Wireless Airpods Pro Airpods Pro', costPrice: 2000, sellingPrice: 4500 },
  { stockQty: 2, brand: 'Generic', category: 'Wireless EV', model: 'V1 Bluethi Pro Wireless Ev', costPrice: 1700, sellingPrice: 3500 },
  { stockQty: 1, brand: 'Generic', category: 'Wireless Mouse', model: 'Wireless M', costPrice: 900, sellingPrice: 2500 },
  { stockQty: 1, brand: 'Generic', category: 'Handsfree', model: 'Handsfree Px2', costPrice: 800, sellingPrice: 1600 },
  { stockQty: 1, brand: 'Bexter', category: 'Charger', model: 'Bexter', costPrice: 400, sellingPrice: 900 },
  { stockQty: 1, brand: 'Bexter', category: 'Cable', model: 'Bexter Micro Data', costPrice: 130, sellingPrice: 400 },
  { stockQty: 1, brand: 'Bexter', category: 'Cable', model: 'Bexter Micro Data', costPrice: 130, sellingPrice: 400 },
  { stockQty: 5, brand: 'BLT', category: 'Cable', model: 'BLT', costPrice: 100, sellingPrice: 300 },
  { stockQty: 3, brand: 'BLT', category: 'Cable', model: 'B-06', costPrice: 100, sellingPrice: 300 },
  { stockQty: 4, brand: 'TTMM', category: 'Earphone', model: 'TTMM', costPrice: 150, sellingPrice: 400 },
  { stockQty: 2, brand: 'Accessory', category: 'Accessory', model: 'Accessory Adjustable Blue Rode', costPrice: 1200, sellingPrice: 2000 },
  { stockQty: 4, brand: 'Accessory', category: 'Accessory', model: 'Adjustable Blue Rode', costPrice: 1200, sellingPrice: 2000 },
  { stockQty: 1, brand: 'GTB', category: 'Wireless GTB', model: 'TW03 Wireless St', costPrice: 800, sellingPrice: 1500 },
  { stockQty: 1, brand: 'GTB', category: 'Wireless', model: 'TW03 Wireless St', costPrice: 800, sellingPrice: 1500 },
  { stockQty: 1, brand: 'Generic', category: 'Wireless GCL', model: 'GCL-19', costPrice: 1000, sellingPrice: 2000 },
  { stockQty: 1, brand: 'Generic', category: 'Wireless', model: 'GCL-19', costPrice: 1000, sellingPrice: 2000 },
  { stockQty: 1, brand: 'GTB', category: 'Wireless', model: 'Deco Series', costPrice: 1000, sellingPrice: 2000 },
  { stockQty: 1, brand: 'GTB', brand2: 'Smartwatch', category: 'Smartwatch', model: 'AP-W11 Ultra Smart', costPrice: 1000, sellingPrice: 2000 },
  { stockQty: 1, brand: 'TTMM', category: 'Charger', model: 'Super Fast 18W', costPrice: 350, sellingPrice: 1000 },
  { stockQty: 1, brand: 'TTMM', category: 'Charger', model: 'Super Fast 18W', costPrice: 350, sellingPrice: 1000 },
  { stockQty: 1, brand: 'TTMM', category: 'Smartwatch', model: 'U1 LUxy 2 Smart Wak', costPrice: 1700, sellingPrice: 3000 },
  { stockQty: 1, brand: 'TTMM', category: 'Smartwatch', model: 'U1 LUxy 2 Smart Wak', costPrice: 1700, sellingPrice: 3000 },
  { stockQty: 1, brand: 'TTMM', category: 'Mobile Pho', model: 'Mobile Pho Pat Log Camera Mo', costPrice: 2100, sellingPrice: 4000 },
  { stockQty: 1, brand: 'TTMM', category: 'Mobile Pho', model: 'Pat Log Camera Mo', costPrice: 2100, sellingPrice: 4000 },
  { stockQty: 1, brand: 'infoilus', category: 'Mobile Pho', model: 'POV', costPrice: 3250, sellingPrice: 6000 },
  { stockQty: 1, brand: 'A-Series', category: 'Mobile Pho', model: 'SCI Max', costPrice: 2100, sellingPrice: 4000 },
  { stockQty: 1, brand: 'Generic', category: 'Mobile Pho', model: 'Mobile Pho Music Pho Muzi', costPrice: 2100, sellingPrice: 4000 },
  { stockQty: 1, brand: 'G', category: 'Mobile Pho', model: 'Music Pho Muzi', costPrice: 2100, sellingPrice: 4000 },
  { stockQty: 1, brand: 'G2', category: 'Mobile Pho', model: 'Music Pho', costPrice: 2100, sellingPrice: 4000 },
  { stockQty: 1, brand: 'G2', category: 'Mobile Pho', model: 'Music Pho', costPrice: 2100, sellingPrice: 4000 },
  { stockQty: 3, brand: 'Zerog', category: 'Mobile Pho', model: 'List Pho 2G Mobile', costPrice: 3300, sellingPrice: 5000 },
  { stockQty: 3, brand: 'Zerog', category: 'Mobile Pho', model: 'List Pho 2G Mobile', costPrice: 3300, sellingPrice: 5000 },
  { stockQty: 1, brand: 'Generic', category: 'Ad Device', model: '4G LTE 4K Head Store', costPrice: 5000, sellingPrice: 10000 },
  { stockQty: 1, brand: 'Generic', category: 'Ad Device', model: '4G LTE 4K Head Store', costPrice: 5000, sellingPrice: 10000 },
  { stockQty: 1, brand: 'Zerog', category: 'Ad Device', model: 'Bot 4rafan Zerog Device', costPrice: 4300, sellingPrice: 7500 },
  { stockQty: 1, brand: 'Zerog', category: 'Ad Device', model: 'Bot 4rafan Zerog Device', costPrice: 4300, sellingPrice: 7500 },
  { stockQty: 1, brand: 'Zerog', category: 'Mobile Pho', model: 'Feature Pho', costPrice: 3000, sellingPrice: 5000 },
  { stockQty: 1, brand: 'Zerog', category: 'Mobile Pho', model: 'Feature Pho', costPrice: 3000, sellingPrice: 5000 },
  { stockQty: 1, brand: 'Generic', category: 'Accessory', model: 'N-08', costPrice: 900, sellingPrice: 2500 },
  { stockQty: 1, brand: 'GT', category: 'Bluetooth', model: 'Bluetooth 1', costPrice: 900, sellingPrice: 2500 },
];

async function main() {
  try {
    console.log('🔍 Checking for Hafiz Mobile Shop...\n');

    // Find the shop
    const shop = await prisma.shop.findFirst({
      where: {
        name: {
          contains: 'Hafiz',
          mode: 'insensitive',
        },
      },
    });

    if (!shop) {
      console.error('❌ Shop "Hafiz Mobile" not found in database!');
      console.log('\n📋 Available shops:');
      const allShops = await prisma.shop.findMany({
        select: { id: true, name: true, code: true },
      });
      allShops.forEach((s) => console.log(`  - ${s.name} (${s.code})`));
      return;
    }

    console.log(`✅ Found shop: ${shop.name} (ID: ${shop.id})\n`);

    // Get existing categories and brands
    const existingCategories = await prisma.category.findMany({
      where: { shopId: shop.id },
    });

    const existingBrands = await prisma.brand.findMany({
      where: { shopId: shop.id },
    });

    console.log(`📦 Existing categories: ${existingCategories.length}`);
    console.log(`🏷️  Existing brands: ${existingBrands.length}\n`);

    // Create maps for quick lookup
    const categoryMap = new Map(existingCategories.map((c) => [c.name.toLowerCase(), c]));
    const brandMap = new Map(existingBrands.map((b) => [b.name.toLowerCase(), b]));

    // Collect unique categories and brands from data
    const uniqueCategories = new Set<string>();
    const uniqueBrands = new Set<string>();

    productData.forEach((item) => {
      uniqueCategories.add(item.category);
      uniqueBrands.add(item.brand);
    });

    console.log(`\n📊 Data Summary:`);
    console.log(`  - Total products to import: ${productData.length}`);
    console.log(`  - Unique categories: ${uniqueCategories.size}`);
    console.log(`  - Unique brands: ${uniqueBrands.size}\n`);

    // Create missing categories
    console.log('🏗️  Creating missing categories...');
    let categoriesCreated = 0;
    for (const categoryName of uniqueCategories) {
      if (!categoryMap.has(categoryName.toLowerCase())) {
        try {
          // Generate unique code
          let code = categoryName.replace(/\s+/g, '-').toUpperCase().substring(0, 10);
          let attempts = 0;
          let category = null;
          
          while (attempts < 10 && !category) {
            try {
              const codeWithSuffix = attempts > 0 ? `${code}-${attempts}` : code;
              category = await prisma.category.create({
                data: {
                  name: categoryName,
                  code: codeWithSuffix.substring(0, 10),
                  shopId: shop.id,
                  isActive: true,
                },
              });
            } catch (e: any) {
              if (e.code === 'P2002') {
                attempts++;
              } else {
                throw e;
              }
            }
          }
          
          if (category) {
            categoryMap.set(categoryName.toLowerCase(), category);
            categoriesCreated++;
            console.log(`  ✓ Created category: ${categoryName}`);
          }
        } catch (error) {
          console.error(`  ⚠️  Failed to create category: ${categoryName}`, error);
        }
      }
    }
    console.log(`✅ Categories created: ${categoriesCreated}\n`);

    // Create missing brands
    console.log('🏗️  Creating missing brands...');
    let brandsCreated = 0;
    for (const brandName of uniqueBrands) {
      if (!brandMap.has(brandName.toLowerCase())) {
        try {
          // Generate unique code
          let code = brandName.replace(/\s+/g, '-').toUpperCase().substring(0, 10);
          let attempts = 0;
          let brand = null;
          
          while (attempts < 10 && !brand) {
            try {
              const codeWithSuffix = attempts > 0 ? `${code}-${attempts}` : code;
              brand = await prisma.brand.create({
                data: {
                  name: brandName,
                  code: codeWithSuffix.substring(0, 10),
                  shopId: shop.id,
                  isActive: true,
                },
              });
            } catch (e: any) {
              if (e.code === 'P2002') {
                attempts++;
              } else {
                throw e;
              }
            }
          }
          
          if (brand) {
            brandMap.set(brandName.toLowerCase(), brand);
            brandsCreated++;
            console.log(`  ✓ Created brand: ${brandName}`);
          }
        } catch (error) {
          console.error(`  ⚠️  Failed to create brand: ${brandName}`, error);
        }
      }
    }
    console.log(`✅ Brands created: ${brandsCreated}\n`);

    // Import products
    console.log('📦 Importing products...\n');
    let productsCreated = 0;
    let productsSkipped = 0;
    let totalInventoryCreated = 0;

    for (const item of productData) {
      const category = categoryMap.get(item.category.toLowerCase());
      const brand = brandMap.get(item.brand.toLowerCase());

      if (!category || !brand) {
        console.error(`  ⚠️  Skipping ${item.model} - missing category or brand`);
        productsSkipped++;
        continue;
      }

      // Generate SKU
      const timestamp = Date.now().toString().slice(-6);
      const sku = `${brand.code.substring(0, 3)}-${category.code.substring(0, 3)}-${timestamp}`;

      // Check if product already exists
      const existingProduct = await prisma.product.findFirst({
        where: {
          shopId: shop.id,
          name: item.model,
          brandId: brand.id,
          categoryId: category.id,
        },
      });

      if (existingProduct) {
        console.log(`  ⏭️  Skipping ${item.model} - already exists`);
        productsSkipped++;
        continue;
      }

      // Create product
      const product = await prisma.product.create({
        data: {
          name: item.model,
          model: item.model,
          sku: sku,
          type: 'MOBILE_PHONE',
          status: 'ACTIVE',
          costPrice: item.costPrice,
          sellingPrice: item.sellingPrice,
          minimumPrice: item.costPrice,
          categoryId: category.id,
          brandId: brand.id,
          shopId: shop.id,
          lowStockThreshold: 5,
          reorderPoint: 10,
        },
      });

      // Create inventory items for stock quantity
      const inventoryItems = [];
      for (let i = 0; i < item.stockQty; i++) {
        inventoryItems.push({
          productId: product.id,
          batchNumber: `BATCH-${Date.now()}-${i + 1}`,
          status: 'IN_STOCK',
          costPrice: item.costPrice,
          purchaseDate: new Date(),
          shopId: shop.id,
        });
      }

      if (inventoryItems.length > 0) {
        await prisma.inventoryItem.createMany({
          data: inventoryItems,
        });
        totalInventoryCreated += inventoryItems.length;
      }

      productsCreated++;
      console.log(`  ✓ Created: ${item.model} (${item.stockQty} units) - ${brand.name} / ${category.name}`);
    }

    console.log('\n✅ Import completed!');
    console.log(`\n📊 Final Summary:`);
    console.log(`  - Products created: ${productsCreated}`);
    console.log(`  - Products skipped: ${productsSkipped}`);
    console.log(`  - Inventory items created: ${totalInventoryCreated}`);
    console.log(`  - Categories created: ${categoriesCreated}`);
    console.log(`  - Brands created: ${brandsCreated}`);
  } catch (error) {
    console.error('❌ Error during import:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
