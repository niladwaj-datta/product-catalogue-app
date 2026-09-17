/**
 * Express.js REST API - MongoDB Product Catalogue
 * ===============================================
 * 
 * A complete RESTful API server for the product catalogue
 * Perfect for integrating with frontend applications
 * 
 * Installation:
 * npm install express mongodb dotenv cors body-parser
 * 
 * Setup:
 * 1. Create .env file:
 *    MONGODB_URI=mongodb://localhost:27017
 *    PORT=5000
 * 
 * 2. Run: node express_api_server.js
 * 
 * API Endpoints:
 * GET    /api/products                - Get all products
 * GET    /api/products/:id            - Get product by ID
 * GET    /api/products/search         - Full-text search
 * GET    /api/products/category/:cat  - Filter by category
 * GET    /api/products/price-range    - Filter by price
 * POST   /api/products                - Create new product
 * PUT    /api/products/:id            - Update product
 * DELETE /api/products/:id            - Delete product
 */

const express = require("express");
const path = require("node:path");
const { MongoClient } = require("mongodb");
const cors = require("cors");
const bodyParser = require("body-parser");
require("dotenv").config();

// ===== SETUP =====
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_CONNECTION_STRING || process.env.MONGODB_URI || "mongodb://localhost:27017";
const DB_NAME = "Product";
const COLLECTION_NAME = "product-catalogue";

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Global database reference
let db = null;
let mongoClient = null;

function parsePositiveInteger(value, fallback, maximum) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }
  return Math.min(parsed, maximum);
}

function parseProductId(value) {
  const productId = Number.parseInt(value, 10);
  return Number.isInteger(productId) ? productId : null;
}

function getUpdatedDocument(result) {
  return result && Object.prototype.hasOwnProperty.call(result, "value")
    ? result.value
    : result;
}

function normalizeProduct(document) {
  const productId = document.productId ?? Number.parseInt(String(document.sku || "").replace(/\D/g, ""), 10);
  const category = typeof document.category === "string"
    ? { mainCategory: document.category, subCategory: document.subcategory || "", tags: document.tags || [] }
    : document.category || {};
  const price = typeof document.price === "number"
    ? { MRP: document.price, sellingPrice: document.price, discount: 0, currency: document.currency || "USD" }
    : document.price || {};
  const stock = typeof document.stock_quantity === "number"
    ? { quantity: document.stock_quantity, unit: "units", reorderLevel: 0 }
    : document.stock || {};
  const ratings = document.ratings || document.rating || {};

  return {
    ...document,
    productId,
    name: document.name,
    description: document.description || "",
    category,
    price,
    stock,
    rating: { average: ratings.average || 0, reviewCount: ratings.reviewCount ?? ratings.count ?? 0 },
    specifications: document.specifications || Object.entries(document.attributes || {}).map(([spec, value]) => ({ spec, value: String(value) })),
    manufacturer: document.manufacturer || "Not specified",
    warranty: document.warranty || "Not specified",
    isActive: document.isActive ?? document.is_active !== false
  };
}

function isActiveProduct(document) {
  return document.isActive !== false && document.is_active !== false;
}

async function getCatalogueProducts() {
  const documents = await db.collection(COLLECTION_NAME).find({ is_active: { $ne: false } }).toArray();
  return documents.filter(isActiveProduct).map(normalizeProduct);
}

// ===== DATABASE CONNECTION =====
async function initializeDB() {
  try {
    mongoClient = new MongoClient(MONGODB_URI, {
      maxPoolSize: 10,
      minPoolSize: 2,
      retryWrites: true
    });

    await mongoClient.connect();
    db = mongoClient.db(DB_NAME);
    console.log("✓ MongoDB Connected");

    // Create text index if not exists
    try {
      await db
        .collection(COLLECTION_NAME)
        .createIndex({
          name: "text",
          description: "text",
          "category.tags": "text",
          manufacturer: "text"
        });
      console.log("✓ Text index created");
    } catch (error) {
      // Index already exists
    }

    return true;
  } catch (error) {
    console.error("✗ MongoDB Connection Failed:", error);
    return false;
  }
}

// ===== ERROR HANDLING MIDDLEWARE =====
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ===== ROUTES =====

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "product_details_ui.html"));
});

/**
 * GET /api/products
 * Get all products with pagination, sorting, and filtering
 * Query params:
 *   - page: Page number (default: 1)
 *   - limit: Items per page (default: 10, max: 50)
 *   - sort: Field to sort by (default: -createdAt)
 *   - category: Filter by main category
 */
app.get(
  "/api/products",
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, sort = "-createdAt", category } = req.query;

    // Validation
    const pageNum = parsePositiveInteger(page, 1, Number.MAX_SAFE_INTEGER);
    const limitNum = parsePositiveInteger(limit, 10, 50);
    const skip = (pageNum - 1) * limitNum;

    try {
      let catalogue = await getCatalogueProducts();
      if (category) catalogue = catalogue.filter((product) => product.category.mainCategory === category);
      const sortField = sort.replace(/^-/, "");
      const direction = sort.startsWith("-") ? -1 : 1;
      catalogue.sort((left, right) => {
        const leftValue = sortField === "createdAt" ? new Date(left.createdAt || 0) : left[sortField];
        const rightValue = sortField === "createdAt" ? new Date(right.createdAt || 0) : right[sortField];
        return (leftValue > rightValue ? 1 : leftValue < rightValue ? -1 : 0) * direction;
      });
      const total = catalogue.length;
      const products = catalogue.slice(skip, skip + limitNum);

      res.json({
        success: true,
        data: products,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total: total,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  })
);

/**
 * GET /api/products/:productId
 * Get single product by ID
 */
app.get(
  "/api/products/:productId",
  asyncHandler(async (req, res) => {
    const productId = parseProductId(req.params.productId);

    if (productId === null) {
      return res.status(400).json({ success: false, error: "Invalid product ID" });
    }

    const product = await db.collection(COLLECTION_NAME).findOne({
      $or: [{ productId }, { sku: `PROD-${productId}` }]
    });

    if (!product) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    res.json({ success: true, data: normalizeProduct(product) });
  })
);

/**
 * GET /api/products/search?q=wireless
 * Full-text search products
 * Query params:
 *   - q: Search query (required)
 *   - limit: Results limit (default: 10)
 */
app.get(
  "/api/search",
  asyncHandler(async (req, res) => {
    const { q, limit = 10 } = req.query;

    if (!q || q.trim().length === 0) {
      return res
        .status(400)
        .json({ success: false, error: "Search query required" });
    }

    const expression = new RegExp(q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    const results = (await getCatalogueProducts())
      .filter((product) => expression.test([product.name, product.description, product.manufacturer, product.category.mainCategory, product.category.subCategory, ...(product.category.tags || [])].join(" ")))
      .slice(0, parsePositiveInteger(limit, 10, 50));

    res.json({
      success: true,
      query: q,
      resultsCount: results.length,
      data: results
    });
  })
);

/**
 * GET /api/products/category/:mainCategory
 * Filter products by category
 * Query params:
 *   - sub: SubCategory (optional)
 *   - minPrice: Minimum price (optional)
 *   - maxPrice: Maximum price (optional)
 *   - minRating: Minimum rating (optional)
 *   - sort: Sort field (default: -rating.average)
 */
app.get(
  "/api/category/:mainCategory",
  asyncHandler(async (req, res) => {
    const {
      mainCategory
    } = req.params;
    const { sub, minPrice, maxPrice, minRating = 0, limit = 20 } = req.query;

    // Build filter
    const limitNum = parsePositiveInteger(limit, 20, 100);
    let products = (await getCatalogueProducts()).filter((product) => product.category.mainCategory === mainCategory);
    if (sub) products = products.filter((product) => product.category.subCategory === sub);
    if (minPrice) products = products.filter((product) => product.price.sellingPrice >= parseFloat(minPrice));
    if (maxPrice) products = products.filter((product) => product.price.sellingPrice <= parseFloat(maxPrice));
    products = products.filter((product) => product.rating.average >= parseFloat(minRating)).sort((left, right) => right.rating.average - left.rating.average).slice(0, limitNum);

    res.json({
      success: true,
      category: mainCategory,
      subcategory: sub || "All",
      count: products.length,
      data: products
    });
  })
);

/**
 * GET /api/products/price-range?min=50000&max=200000
 * Filter products by price range
 */
app.get(
  "/api/price-range",
  asyncHandler(async (req, res) => {
    const { min = 0, max = 1000000, sort = "asc" } = req.query;

    const minPrice = parseFloat(min);
    const maxPrice = parseFloat(max);

    const sortOrder = sort === "desc" ? -1 : 1;

    const products = (await getCatalogueProducts())
      .filter((product) => product.price.sellingPrice >= minPrice && product.price.sellingPrice <= maxPrice)
      .sort((left, right) => (left.price.sellingPrice - right.price.sellingPrice) * sortOrder);

    res.json({
      success: true,
      priceRange: { min: minPrice, max: maxPrice },
      count: products.length,
      data: products
    });
  })
);

/**
 * GET /api/top-rated?minRating=4.5&limit=10
 * Get top-rated products
 */
app.get(
  "/api/top-rated",
  asyncHandler(async (req, res) => {
    const { minRating = 4.5, limit = 10 } = req.query;

    const products = (await getCatalogueProducts())
      .filter((product) => product.rating.average >= parseFloat(minRating))
      .sort((left, right) => right.rating.average - left.rating.average || right.rating.reviewCount - left.rating.reviewCount)
      .slice(0, parsePositiveInteger(limit, 10, 100));

    res.json({
      success: true,
      minRating: parseFloat(minRating),
      count: products.length,
      data: products
    });
  })
);

/**
 * GET /api/categories
 * Get all available categories
 */
app.get(
  "/api/categories",
  asyncHandler(async (req, res) => {
    const categories = await db
      .collection(COLLECTION_NAME)
      .aggregate([
        {
          $group: {
            _id: "$category.mainCategory",
            subCategories: {
              $addToSet: "$category.subCategory"
            },
            productCount: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
      .toArray();

    res.json({
      success: true,
      count: categories.length,
      data: categories
    });
  })
);

/**
 * POST /api/products
 * Create new product
 * Body: Product object
 */
app.post(
  "/api/products",
  asyncHandler(async (req, res) => {
    const productData = req.body;

    // Validation
    if (!productData.name || !productData.productId) {
      return res
        .status(400)
        .json({
          success: false,
          error: "name and productId are required"
        });
    }

    const newProduct = {
      ...productData,
      createdAt: new Date(),
      updatedAt: new Date(),
      isActive: productData.isActive !== false
    };

    const result = await db
      .collection(COLLECTION_NAME)
      .insertOne(newProduct);

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      insertedId: result.insertedId,
      data: newProduct
    });
  })
);

/**
 * PUT /api/products/:productId
 * Update product
 */
app.put(
  "/api/products/:productId",
  asyncHandler(async (req, res) => {
    const updateData = req.body;

    // Remove immutable fields
    delete updateData.productId;
    delete updateData.createdAt;
    delete updateData._id;

    const productId = parseProductId(req.params.productId);
    if (productId === null) {
      return res.status(400).json({ success: false, error: "Invalid product ID" });
    }

    const result = await db
      .collection(COLLECTION_NAME)
      .findOneAndUpdate(
        { productId },
        {
          $set: { ...updateData, updatedAt: new Date() }
        },
        { returnDocument: "after" }
      );

    const updatedProduct = getUpdatedDocument(result);
    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    res.json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct
    });
  })
);

/**
 * DELETE /api/products/:productId
 * Soft delete (mark as inactive)
 */
app.delete(
  "/api/products/:productId",
  asyncHandler(async (req, res) => {
    const productId = parseProductId(req.params.productId);
    if (productId === null) {
      return res.status(400).json({ success: false, error: "Invalid product ID" });
    }

    const result = await db
      .collection(COLLECTION_NAME)
      .findOneAndUpdate(
        { productId },
        {
          $set: { isActive: false, updatedAt: new Date() }
        },
        { returnDocument: "after" }
      );

    const deletedProduct = getUpdatedDocument(result);
    if (!deletedProduct) {
      return res
        .status(404)
        .json({ success: false, error: "Product not found" });
    }

    res.json({
      success: true,
      message: "Product deleted successfully",
      data: deletedProduct
    });
  })
);

/**
 * GET /api/analytics/categories
 * Revenue analysis by category
 */
app.get(
  "/api/analytics/categories",
  asyncHandler(async (req, res) => {
    const analytics = await db
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

    res.json({
      success: true,
      categoryAnalytics: analytics,
      totalCategories: analytics.length
    });
  })
);

/**
 * GET /api/health
 * Health check endpoint
 */
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "API is running",
    database: db ? "Connected" : "Disconnected",
    timestamp: new Date().toISOString()
  });
});

// ===== 404 HANDLER =====
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: "Route not found"
  });
});

// ===== ERROR HANDLER =====
app.use((error, req, res, next) => {
  console.error("Error:", error);
  res.status(500).json({
    success: false,
    error: error.message || "Internal server error"
  });
});

// ===== START SERVER =====
async function startServer() {
  const server = app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════╗
║   Product Catalogue API Server Running    ║
╚═══════════════════════════════════════════╝

🌐 Server: http://localhost:${PORT}
📊 Database: ${DB_NAME}
📦 Collection: ${COLLECTION_NAME}

Available Endpoints:
  GET  /api/products                    - List all products
  GET  /api/products/:productId         - Get product details
  GET  /api/search?q=query              - Full-text search
  GET  /api/category/:mainCategory      - Filter by category
  GET  /api/price-range                 - Filter by price
  GET  /api/top-rated                   - Top-rated products
  GET  /api/categories                  - List categories
  GET  /api/analytics/categories        - Revenue analysis
  POST /api/products                    - Create product
  PUT  /api/products/:productId         - Update product
  DELETE /api/products/:productId       - Delete product
  GET  /api/health                      - Health check

📖 Try: http://localhost:${PORT}/api/products?limit=5
`);
  });

  const connected = await initializeDB();
  if (!connected) {
    console.error("Failed to connect to MongoDB; API routes requiring data will remain unavailable");
  }

  const closeServer = async () => {
    server.close();
    if (mongoClient) {
      await mongoClient.close();
    }
  };

  process.once("SIGINT", closeServer);
  process.once("SIGTERM", closeServer);
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { app, initializeDB, startServer };
