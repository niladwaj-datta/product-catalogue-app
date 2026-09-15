/**
 * Node.js MongoDB Integration - Product Catalogue
 * ===============================================
 * 
 * Complete working examples for connecting to and querying MongoDB
 * Using: MongoDB Node.js Driver
 * 
 * Installation:
 * npm install mongodb dotenv
 * 
 * Setup:
 * 1. Create .env file with: MONGODB_URI=mongodb://localhost:27017
 * 2. Run: node nodejs_mongodb_integration.js
 */

const { MongoClient, ObjectId } = require("mongodb");
require("dotenv").config();

// ===== CONNECTION SETUP =====
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = "Product";
const COLLECTION_NAME = "product-catalogue";

const client = new MongoClient(MONGODB_URI, {
  maxPoolSize: 10,
  minPoolSize: 2,
  retryWrites: true
});

// ===== DATABASE CONNECTION =====
async function connectDB() {
  try {
    await client.connect();
    console.log("✓ Connected to MongoDB");
    return client.db(DB_NAME);
  } catch (error) {
    console.error("✗ MongoDB Connection Failed:", error);
    process.exit(1);
  }
}

// ===== FUNCTION 1: GET ALL PRODUCTS =====
async function getAllProducts(db, limit = 10) {
  console.log("\n--- GET ALL PRODUCTS ---");

  const products = await db
    .collection(COLLECTION_NAME)
    .find()
    .limit(limit)
    .toArray();

  products.forEach((product) => {
    console.log(`\n${product.name}`);
    console.log(`  Price: ₹${product.price.sellingPrice}`);
    console.log(`  Rating: ⭐ ${product.rating.average} (${product.rating.reviewCount} reviews)`);
    console.log(`  In Stock: ${product.stock.quantity} ${product.stock.unit}`);
  });

  return products;
}

// ===== FUNCTION 2: SEARCH PRODUCTS BY CATEGORY =====
async function getProductsByCategory(db, mainCategory, subCategory = null) {
  console.log(`\n--- PRODUCTS IN ${mainCategory} ---`);

  const filter = { "category.mainCategory": mainCategory };
  if (subCategory) {
    filter["category.subCategory"] = subCategory;
  }

  const products = await db
    .collection(COLLECTION_NAME)
    .find(filter)
    .project({
      name: 1,
      "price.sellingPrice": 1,
      "rating.average": 1,
      "stock.quantity": 1
    })
    .sort({ "rating.average": -1 })
    .toArray();

  if (products.length === 0) {
    console.log("No products found in this category");
    return;
  }

  products.forEach((product, index) => {
    console.log(
      `${index + 1}. ${product.name} - ₹${product.price.sellingPrice} (⭐${product.rating.average})`
    );
  });

  return products;
}

// ===== FUNCTION 3: PRICE RANGE FILTER =====
async function getProductsByPriceRange(db, minPrice, maxPrice) {
  console.log(
    `\n--- PRODUCTS BETWEEN ₹${minPrice} - ₹${maxPrice} ---`
  );

  const products = await db
    .collection(COLLECTION_NAME)
    .find({
      "price.sellingPrice": { $gte: minPrice, $lte: maxPrice }
    })
    .project({
      name: 1,
      "price.sellingPrice": 1,
      "price.MRP": 1,
      "price.discount": 1,
      "rating.average": 1
    })
    .sort({ "price.sellingPrice": 1 })
    .toArray();

  if (products.length === 0) {
    console.log("No products in this price range");
    return;
  }

  products.forEach((product) => {
    const savings = product.price.MRP - product.price.sellingPrice;
    console.log(`
${product.name}
  MRP: ₹${product.price.MRP} → Selling: ₹${product.price.sellingPrice}
  Discount: ${product.price.discount}% (Save ₹${savings})
  Rating: ⭐${product.rating.average}`);
  });

  return products;
}

// ===== FUNCTION 4: TEXT SEARCH =====
async function searchProducts(db, searchQuery) {
  console.log(`\n--- SEARCHING FOR: "${searchQuery}" ---`);

  // Ensure text index exists
  try {
    await db
      .collection(COLLECTION_NAME)
      .createIndex({
        name: "text",
        description: "text",
        "category.tags": "text",
        manufacturer: "text"
      });
  } catch (error) {
    // Index might already exist
  }

  const results = await db
    .collection(COLLECTION_NAME)
    .find({ $text: { $search: searchQuery } })
    .project({
      name: 1,
      description: 1,
      "category.mainCategory": 1,
      "price.sellingPrice": 1,
      score: { $meta: "textScore" }
    })
    .sort({ score: { $meta: "textScore" } })
    .toArray();

  if (results.length === 0) {
    console.log(`No products found matching "${searchQuery}"`);
    return;
  }

  results.forEach((product, index) => {
    console.log(`
${index + 1}. ${product.name}
    Category: ${product.category.mainCategory}
    Price: ₹${product.price.sellingPrice}
    Relevance Score: ${product.score.toFixed(2)}`);
  });

  return results;
}

// ===== FUNCTION 5: HIGH-RATED PRODUCTS =====
async function getTopRatedProducts(db, minRating = 4.5, limit = 10) {
  console.log(`\n--- TOP PRODUCTS (Rating >= ${minRating}) ---`);

  const products = await db
    .collection(COLLECTION_NAME)
    .find({ "rating.average": { $gte: minRating } })
    .project({
      name: 1,
      "rating.average": 1,
      "rating.reviewCount": 1,
      "category.mainCategory": 1,
      "price.sellingPrice": 1
    })
    .sort({
      "rating.average": -1,
      "rating.reviewCount": -1  // Tiebreaker: more reviews = better
    })
    .limit(limit)
    .toArray();

  products.forEach((product, index) => {
    console.log(`
${index + 1}. ${product.name}
    Rating: ⭐${product.rating.average} (${product.rating.reviewCount} reviews)
    Category: ${product.category.mainCategory}
    Price: ₹${product.price.sellingPrice}`);
  });

  return products;
}

// ===== FUNCTION 6: FIND PRODUCT BY ID =====
async function getProductById(db, productId) {
  console.log(`\n--- PRODUCT ID: ${productId} ---`);

  const product = await db
    .collection(COLLECTION_NAME)
    .findOne({ productId: productId });

  if (!product) {
    console.log("Product not found");
    return null;
  }

  console.log(`
${product.name}
${product.description}

Category: ${product.category.mainCategory} > ${product.category.subCategory}
Tags: ${product.category.tags.join(", ")}

Pricing:
  MRP: ₹${product.price.MRP}
  Selling Price: ₹${product.price.sellingPrice}
  Discount: ${product.price.discount}%
  Currency: ${product.price.currency}

Availability:
  Stock: ${product.stock.quantity} ${product.stock.unit}
  Reorder Level: ${product.stock.reorderLevel}

Rating: ⭐${product.rating.average} (${product.rating.reviewCount} customer reviews)

Manufacturer: ${product.manufacturer}
Warranty: ${product.warranty}

Specifications:`);

  product.specifications.forEach((spec) => {
    console.log(`  • ${spec.spec}: ${spec.value}`);
  });

  return product;
}

// ===== FUNCTION 7: INSERT NEW PRODUCT =====
async function addNewProduct(db, productData) {
  console.log("\n--- ADDING NEW PRODUCT ---");

  const newProduct = {
    productId: productData.productId,
    name: productData.name,
    description: productData.description,
    category: productData.category,
    price: productData.price,
    stock: productData.stock,
    rating: productData.rating,
    specifications: productData.specifications || [],
    images: productData.images || [],
    manufacturer: productData.manufacturer,
    warranty: productData.warranty,
    createdAt: new Date(),
    updatedAt: new Date(),
    isActive: true
  };

  const result = await db
    .collection(COLLECTION_NAME)
    .insertOne(newProduct);

  console.log(`✓ Product inserted with ID: ${result.insertedId}`);
  console.log(`Product Name: ${newProduct.name}`);

  return result;
}

// ===== FUNCTION 8: UPDATE PRODUCT STOCK =====
async function updateStock(db, productId, quantityChange) {
  console.log(`\n--- UPDATING STOCK FOR PRODUCT ${productId} ---`);

  const result = await db
    .collection(COLLECTION_NAME)
    .findOneAndUpdate(
      { productId: productId },
      {
        $inc: { "stock.quantity": quantityChange },
        $set: { updatedAt: new Date() }
      },
      { returnDocument: "after" }
    );

  if (!result.value) {
    console.log("Product not found");
    return;
  }

  console.log(`✓ Stock Updated`);
  console.log(`Product: ${result.value.name}`);
  console.log(`New Stock Quantity: ${result.value.stock.quantity} ${result.value.stock.unit}`);

  return result.value;
}

// ===== FUNCTION 9: UPDATE PRODUCT PRICE =====
async function updatePrice(db, productId, newSellingPrice) {
  console.log(`\n--- UPDATING PRICE FOR PRODUCT ${productId} ---`);

  // Get current product to calculate new discount
  const product = await db
    .collection(COLLECTION_NAME)
    .findOne({ productId: productId });

  if (!product) {
    console.log("Product not found");
    return;
  }

  const newDiscount = Math.round(
    ((product.price.MRP - newSellingPrice) / product.price.MRP) * 100
  );

  const result = await db
    .collection(COLLECTION_NAME)
    .findOneAndUpdate(
      { productId: productId },
      {
        $set: {
          "price.sellingPrice": newSellingPrice,
          "price.discount": newDiscount,
          updatedAt: new Date()
        }
      },
      { returnDocument: "after" }
    );

  console.log(`✓ Price Updated`);
  console.log(`Product: ${result.value.name}`);
  console.log(`Old Price: ₹${product.price.sellingPrice}`);
  console.log(`New Price: ₹${newSellingPrice}`);
  console.log(`New Discount: ${newDiscount}%`);

  return result.value;
}

// ===== FUNCTION 10: AGGREGATION - CATEGORY REVENUE =====
async function getCategoryRevenue(db) {
  console.log("\n--- CATEGORY-WISE REVENUE ANALYSIS ---");

  const results = await db
    .collection(COLLECTION_NAME)
    .aggregate([
      { $match: { isActive: true } },
      {
        $group: {
          _id: "$category.mainCategory",
          totalRevenue: {
            $sum: {
              $multiply: ["$price.sellingPrice", "$stock.quantity"]
            }
          },
          averageRating: { $avg: "$rating.average" },
          productCount: { $sum: 1 },
          totalStock: { $sum: "$stock.quantity" }
        }
      },
      { $sort: { totalRevenue: -1 } }
    ])
    .toArray();

  results.forEach((result) => {
    console.log(`
${result._id}
  Products: ${result.productCount}
  Total Stock: ${result.totalStock} units
  Total Revenue Potential: ₹${result.totalRevenue.toLocaleString("en-IN")}
  Average Rating: ⭐${result.averageRating.toFixed(2)}`);
  });

  return results;
}

// ===== FUNCTION 11: AGGREGATION - PRICE DISTRIBUTION =====
async function getPriceDistribution(db) {
  console.log("\n--- PRICE RANGE DISTRIBUTION ---");

  const results = await db
    .collection(COLLECTION_NAME)
    .aggregate([
      {
        $bucket: {
          groupBy: "$price.sellingPrice",
          boundaries: [0, 50000, 100000, 200000, 500000],
          default: "Above 500k",
          output: {
            count: { $sum: 1 },
            productNames: { $push: "$name" }
          }
        }
      }
    ])
    .toArray();

  const ranges = ["₹0 - 50k", "₹50k - 100k", "₹100k - 200k", "₹200k - 500k"];

  results.forEach((bucket, index) => {
    const label = typeof bucket._id === "string" ? bucket._id : ranges[index];
    console.log(`
${label}: ${bucket.count} products
  ${bucket.productNames.join(", ")}`);
  });

  return results;
}

// ===== MAIN EXECUTION =====
async function main() {
  const db = await connectDB();
  const productsCollection = db.collection(COLLECTION_NAME);

  try {
    console.log("\n╔════════════════════════════════════════╗");
    console.log("║  MongoDB Product Catalogue Demo        ║");
    console.log("╚════════════════════════════════════════╝");

    // Verify connection
    const count = await productsCollection.countDocuments();
    console.log(`\nTotal Products in Database: ${count}`);

    // ===== EXECUTE SAMPLE QUERIES =====

    // 1. Get all products
    await getAllProducts(db, 3);

    // 2. Filter by category
    await getProductsByCategory(db, "Electronics", "Laptops");

    // 3. Price range filter
    await getProductsByPriceRange(db, 100000, 250000);

    // 4. Text search
    await searchProducts(db, "wireless");

    // 5. Top rated products
    await getTopRatedProducts(db, 4.7, 5);

    // 6. Get specific product
    await getProductById(db, 1001);

    // 7. Add new product (example data)
    await addNewProduct(db, {
      productId: 1021,
      name: "Realme GT 5 Pro",
      description:
        "Premium smartphone with 240W fast charging and Snapdragon 8 Gen 3",
      category: {
        mainCategory: "Electronics",
        subCategory: "Smartphones",
        tags: ["Android", "5G", "flagship"]
      },
      price: {
        MRP: 84999,
        sellingPrice: 74999,
        discount: 12,
        currency: "INR"
      },
      stock: { quantity: 45, unit: "pieces", reorderLevel: 10 },
      rating: { average: 4.6, reviewCount: 312 },
      specifications: [
        { spec: "Processor", value: "Snapdragon 8 Gen 3" },
        { spec: "RAM", value: "12GB" },
        { spec: "Storage", value: "256GB" },
        { spec: "Display", value: "6.78-inch AMOLED" }
      ],
      images: ["/img/products/realme-gt-5-pro.jpg"],
      manufacturer: "Realme",
      warranty: "1 Year Manufacturer Warranty"
    });

    // 8. Update stock
    await updateStock(db, 1001, -2);  // Sold 2 units

    // 9. Update price (sale)
    await updatePrice(db, 1003, 24999);

    // 10. Revenue analysis
    await getCategoryRevenue(db);

    // 11. Price distribution
    await getPriceDistribution(db);

    console.log("\n✓ All demo queries executed successfully!");
  } catch (error) {
    console.error("Error during execution:", error);
  } finally {
    await client.close();
    console.log("\n✓ Database connection closed");
  }
}

// Run main function
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  getAllProducts,
  getProductsByCategory,
  getProductsByPriceRange,
  searchProducts,
  getTopRatedProducts,
  getProductById,
  addNewProduct,
  updateStock,
  updatePrice,
  getCategoryRevenue,
  getPriceDistribution,
  connectDB
};
