# MongoDB Product Catalogue - Step-by-Step Implementation Guide

**Target Audience:** BTech 2nd Year Students  
**Estimated Time:** 3-4 hours total  
**Difficulty Level:** Intermediate  

---

## 📋 Table of Contents
1. [Phase 1: Setup MongoDB](#phase-1-setup-mongodb)
2. [Phase 2: Load Product Catalogue](#phase-2-load-product-catalogue)
3. [Phase 3: Test CRUD Operations](#phase-3-test-crud-operations)
4. [Phase 4: Create Indexes](#phase-4-create-indexes)
5. [Phase 5: Aggregation Pipelines](#phase-5-aggregation-pipelines)
6. [Phase 6: Node.js Integration (Optional)](#phase-6-nodejs-integration-optional)
7. [Phase 7: Express API Server (Bonus)](#phase-7-express-api-server-bonus)

---

## Phase 1: Setup MongoDB

### Step 1.1: Installation

**For Windows:**
1. Download from [MongoDB Community](https://www.mongodb.com/try/download/community)
2. Run installer (accept all defaults)
3. Restart computer

**For macOS:**
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb-community
```

**For Linux (Ubuntu):**
```bash
curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
apt-get update
apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
```

**Using Docker:**
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 1.2: Verify Installation

Open a new terminal:

```bash
# Check if MongoDB is running
ps aux | grep mongod

# Or check via brew
brew services list
```

---

## Phase 2: Load Product Catalogue

### Step 2.1: Start MongoDB Shell

```bash
# Open MongoDB shell
mongosh
# or (older versions)
mongo
```

You should see:
```
test> 
```

### Step 2.2: Switch to productDB Database

```javascript
use productDB
```

Output: `switched to db productDB`

### Step 2.3: Create Collection with Validation

Copy-paste this entire section:

```javascript
db.createCollection("products", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: [
        "productId",
        "name",
        "category",
        "price",
        "stock",
        "rating",
        "description"
      ],
      properties: {
        _id: { bsonType: "objectId" },
        productId: {
          bsonType: "int",
          description: "Unique product identifier"
        },
        name: {
          bsonType: "string",
          minLength: 3,
          maxLength: 200,
          description: "Product name"
        },
        description: {
          bsonType: "string",
          minLength: 10,
          maxLength: 1000,
          description: "Detailed product description"
        },
        category: {
          bsonType: "object",
          required: ["mainCategory", "subCategory"],
          properties: {
            mainCategory: { bsonType: "string" },
            subCategory: { bsonType: "string" },
            tags: { bsonType: "array", items: { bsonType: "string" } }
          }
        },
        price: {
          bsonType: "object",
          required: ["MRP", "sellingPrice", "currency"],
          properties: {
            MRP: { bsonType: "double" },
            sellingPrice: { bsonType: "double" },
            discount: { bsonType: "int" },
            currency: { bsonType: "string" }
          }
        },
        stock: {
          bsonType: "object",
          required: ["quantity", "unit"],
          properties: {
            quantity: { bsonType: "int" },
            unit: { bsonType: "string" },
            reorderLevel: { bsonType: "int" }
          }
        },
        rating: {
          bsonType: "object",
          properties: {
            average: { bsonType: "double" },
            reviewCount: { bsonType: "int" }
          }
        },
        specifications: {
          bsonType: "array",
          items: {
            bsonType: "object",
            properties: {
              spec: { bsonType: "string" },
              value: { bsonType: "string" }
            }
          }
        },
        images: {
          bsonType: "array",
          items: { bsonType: "string" }
        },
        manufacturer: { bsonType: "string" },
        warranty: { bsonType: "string" },
        createdAt: { bsonType: "date" },
        updatedAt: { bsonType: "date" },
        isActive: { bsonType: "bool" }
      }
    }
  }
});
```

Expected output: `{ ok: 1 }`

### Step 2.4: Insert 20 Products

Copy and paste from the `mongodb_product_catalogue.js` file (lines starting from `db.products.insertMany([`).

This will insert all 20 products.

### Step 2.5: Verify Data Load

```javascript
// Check total products
db.products.countDocuments();
// Output: 20

// View first product
db.products.findOne();

// View all products (basic info)
db.products.find().pretty();
```

✅ **Checkpoint:** If you see 20 products, Phase 2 is complete!

---

## Phase 3: Test CRUD Operations

### Step 3.1: CREATE - Add a New Product

```javascript
db.products.insertOne({
  productId: 1021,
  name: "Google Pixel 8 Pro",
  description: "Latest Google smartphone with AI-powered features, advanced camera system, and 7-year software support",
  category: {
    mainCategory: "Electronics",
    subCategory: "Smartphones",
    tags: ["Android", "AI", "5G", "2024"]
  },
  price: {
    MRP: 119999,
    sellingPrice: 99999,
    discount: 17,
    currency: "INR"
  },
  stock: {
    quantity: 35,
    unit: "pieces",
    reorderLevel: 10
  },
  rating: {
    average: 4.7,
    reviewCount: 234
  },
  specifications: [
    { spec: "Processor", value: "Google Tensor G4" },
    { spec: "Camera", value: "50MP main + 48MP telephoto" },
    { spec: "Storage", value: "256GB" },
    { spec: "Display", value: "6.7-inch OLED" }
  ],
  images: ["/img/products/pixel-8-pro.jpg"],
  manufacturer: "Google LLC",
  warranty: "2 Year Manufacturer Warranty",
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true
});
```

Expected output: `{ acknowledged: true, insertedId: ObjectId(...) }`

### Step 3.2: READ - Query Products

```javascript
// Find by category
db.products.find({ "category.mainCategory": "Electronics" }).pretty();

// Find with filter
db.products.find({ "price.sellingPrice": { $lt: 50000 } }).pretty();

// Find single product
db.products.findOne({ productId: 1001 });

// Get specific fields
db.products.find({ productId: 1001 }, { name: 1, "price.sellingPrice": 1 }).pretty();
```

### Step 3.3: UPDATE - Modify Products

```javascript
// Update stock (after sale)
db.products.updateOne(
  { productId: 1001 },
  { $inc: { "stock.quantity": -1 } }
);

// Verify update
db.products.findOne({ productId: 1001 }, { name: 1, "stock.quantity": 1 });

// Update multiple fields (sale discount)
db.products.updateOne(
  { productId: 1003 },
  {
    $set: {
      "price.discount": 25,
      "price.sellingPrice": 26249,
      updatedAt: new Date()
    }
  }
);

// Update many (bulk discount)
db.products.updateMany(
  { "category.mainCategory": "Electronics" },
  { $set: { "price.discount": 20 } }
);
```

### Step 3.4: DELETE - Remove Products

```javascript
// Soft delete (recommended)
db.products.updateOne(
  { productId: 1021 },
  { $set: { isActive: false, updatedAt: new Date() } }
);

// Verify soft delete
db.products.findOne({ productId: 1021 }, { name: 1, isActive: 1 });

// Hard delete
db.products.deleteOne({ productId: 1021 });

// Verify deletion
db.products.countDocuments({ productId: 1021 });  // Should be 0
```

✅ **Checkpoint:** If all CRUD operations work, Phase 3 is complete!

---

## Phase 4: Create Indexes

### Step 4.1: Understand Index Benefits

An index speeds up queries. Let's add strategic indexes:

```javascript
// Index 1: Product ID (for fast lookups)
db.products.createIndex({ productId: 1 });

// Index 2: Category filtering
db.products.createIndex({ 
  "category.mainCategory": 1, 
  "category.subCategory": 1 
});

// Index 3: Price-based queries
db.products.createIndex({ 
  "price.sellingPrice": 1,
  "rating.average": -1
});

// Index 4: Stock availability
db.products.createIndex({ "stock.quantity": 1 });

// Index 5: Active products
db.products.createIndex({ isActive: 1 });

// Index 6: Date-based sorting
db.products.createIndex({ createdAt: -1 });

// Index 7: Text search (full-text)
db.products.createIndex({
  name: "text",
  description: "text",
  "category.tags": "text",
  manufacturer: "text"
});
```

### Step 4.2: Verify Indexes Created

```javascript
// List all indexes
db.products.getIndexes();

// Should show: 8 indexes (7 we created + 1 default _id)
```

### Step 4.3: Test Query Performance

Before index:
```javascript
db.products.find({ "category.mainCategory": "Electronics" }).explain("executionStats");
```

Look for: `executionStages.stage: "COLLSCAN"` (bad - full collection scan)

After index:
```javascript
db.products.find({ "category.mainCategory": "Electronics" }).explain("executionStats");
```

Look for: `executionStages.stage: "IXSCAN"` (good - index scan)

Compare `totalDocsExamined` before and after - should be reduced significantly.

✅ **Checkpoint:** If all 8 indexes are created, Phase 4 is complete!

---

## Phase 5: Aggregation Pipelines

### Step 5.1: Revenue by Category

```javascript
db.products.aggregate([
  // Stage 1: Filter active products
  { $match: { isActive: true } },
  
  // Stage 2: Group by category and calculate revenue
  {
    $group: {
      _id: "$category.mainCategory",
      totalRevenue: {
        $sum: { $multiply: ["$price.sellingPrice", "$stock.quantity"] }
      },
      averageRating: { $avg: "$rating.average" },
      productCount: { $sum: 1 }
    }
  },
  
  // Stage 3: Sort by revenue
  { $sort: { totalRevenue: -1 } }
]).pretty();
```

Expected output shows revenue breakdown by category.

### Step 5.2: Price Distribution

```javascript
db.products.aggregate([
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
]).pretty();
```

Shows products grouped by price ranges.

### Step 5.3: Top Manufacturers

```javascript
db.products.aggregate([
  { $match: { isActive: true } },
  {
    $group: {
      _id: "$manufacturer",
      productCount: { $sum: 1 },
      averageRating: { $avg: "$rating.average" },
      totalReviews: { $sum: "$rating.reviewCount" }
    }
  },
  { $sort: { productCount: -1 } }
]).pretty();
```

### Step 5.4: High-Engagement Products

```javascript
db.products.aggregate([
  {
    $match: {
      isActive: true,
      "rating.average": { $gte: 4.6 },
      "rating.reviewCount": { $gte: 500 }
    }
  },
  {
    $project: {
      name: 1,
      "rating.average": 1,
      "rating.reviewCount": 1,
      "price.sellingPrice": 1,
      engagementScore: {
        $multiply: [
          { $divide: ["$rating.average", 5] },
          { $log: ["$rating.reviewCount"] }
        ]
      }
    }
  },
  { $sort: { engagementScore: -1 } },
  { $limit: 5 }
]).pretty();
```

✅ **Checkpoint:** If all aggregation pipelines work, Phase 5 is complete!

---

## Phase 6: Node.js Integration (Optional)

### Step 6.1: Setup Node.js Environment

```bash
# Create project folder
mkdir mongodb-product-catalogue
cd mongodb-product-catalogue

# Initialize npm
npm init -y

# Install dependencies
npm install mongodb dotenv
```

### Step 6.2: Create .env File

```bash
# Create .env file
touch .env

# Edit and add:
MONGODB_URI=mongodb://localhost:27017
```

### Step 6.3: Copy Node.js Integration Script

Copy the entire `nodejs_mongodb_integration.js` file to your project folder.

### Step 6.4: Run Node.js Script

```bash
# Run the integration script
node nodejs_mongodb_integration.js

# You should see output from various queries
```

✅ **Checkpoint:** If Node.js script runs without errors, Phase 6 is complete!

---

## Phase 7: Express API Server (Bonus)

### Step 7.1: Install Express Dependencies

```bash
npm install express cors body-parser
```

### Step 7.2: Copy Express Server

Copy the entire `express_api_server.js` file to your project folder.

### Step 7.3: Start the Server

```bash
node express_api_server.js

# You should see:
# ✓ MongoDB Connected
# ✓ Text index created
# Product Catalogue API Server Running
# 🌐 Server: http://localhost:5000
```

### Step 7.4: Test API Endpoints

Open a new terminal and test endpoints:

```bash
# Get all products
curl http://localhost:5000/api/products

# Get products in category
curl http://localhost:5000/api/category/Electronics

# Search
curl http://localhost:5000/api/search?q=wireless

# Get top-rated
curl http://localhost:5000/api/top-rated

# Health check
curl http://localhost:5000/api/health
```

### Step 7.5: Test with Postman (Optional)

1. Download [Postman](https://www.postman.com/)
2. Create new requests for each endpoint
3. Save requests in a collection

---

## 🎯 Project Deliverables Checklist

### Documentation
- [ ] Schema explanation (why embedded, denormalized, etc.)
- [ ] Index strategy document
- [ ] Query performance analysis
- [ ] Database design decisions

### Code
- [ ] mongodb_product_catalogue.js (with schema validation)
- [ ] nodejs_mongodb_integration.js (with 11 functions)
- [ ] express_api_server.js (with 13 endpoints)
- [ ] .env configuration file

### Testing & Results
- [ ] CRUD operations documentation with output
- [ ] Aggregation pipeline examples with results
- [ ] Query performance comparisons (before/after indexing)
- [ ] API endpoint testing with sample requests/responses

### Analysis
- [ ] What would you do differently?
- [ ] Scalability considerations
- [ ] Security considerations (validation, injection prevention)
- [ ] Performance optimization recommendations

---

## 📊 Expected Timeline

| Phase | Task | Time |
|-------|------|------|
| 1 | MongoDB Setup | 15 min |
| 2 | Load Data | 10 min |
| 3 | CRUD Testing | 20 min |
| 4 | Create Indexes | 15 min |
| 5 | Aggregations | 30 min |
| 6 | Node.js (Optional) | 30 min |
| 7 | Express API (Bonus) | 45 min |
| - | Documentation | 30 min |
| **Total** | | **3.5 hours** |

---

## 🐛 Common Issues & Solutions

### Issue: "MongoDB Connection Refused"
**Solution:** 
```bash
# Make sure MongoDB is running
mongod

# Check if running
ps aux | grep mongod
```

### Issue: "Collection Already Exists"
**Solution:**
```javascript
db.products.drop();
// Then re-run creation script
```

### Issue: "Validation Error on Insert"
**Solution:**
```javascript
// Drop validation temporarily
db.runCommand({
  collMod: "products",
  validator: {}
});
```

### Issue: "Text Index Already Exists"
**Solution:**
```javascript
db.products.dropIndex("name_text_description_text...");
// Or drop all indexes
db.products.dropIndexes();
```

### Issue: "Node.js says MongoDB not connected"
**Solution:**
```bash
# Check MONGODB_URI in .env
# Make sure MongoDB is running
# Try with explicit connection string

const client = new MongoClient("mongodb://localhost:27017");
```

---

## 🏆 Evaluation Tips

For maximum points:

1. **Show Index Performance**
   - Run same query with explain() before/after indexing
   - Document performance metrics

2. **Document Design Decisions**
   - Why did you embed category?
   - Why did you separate price.MRP and price.sellingPrice?
   - Why soft delete instead of hard delete?

3. **Advanced Queries**
   - Use aggregation pipelines
   - Implement text search
   - Show $expr with conditional logic

4. **Code Quality**
   - Add comments explaining complex queries
   - Use consistent naming
   - Proper error handling

5. **Performance Analysis**
   - Show COLLSCAN vs IXSCAN
   - Document execution times
   - Explain optimization strategies

---

## 📚 Next Steps After Completion

1. **Frontend Integration**
   - Create React/Vue app to consume the API
   - Implement product listing page
   - Add search functionality

2. **Advanced Features**
   - Add user authentication
   - Implement reviews/ratings
   - Shopping cart functionality
   - Order management

3. **DevOps**
   - Deploy to MongoDB Atlas (cloud)
   - Containerize with Docker
   - Deploy API to Heroku/Railway

4. **Performance**
   - Implement caching (Redis)
   - Add pagination
   - Optimize aggregation pipelines

---

**Good luck with your project!** 🎉

If you get stuck, refer back to `SETUP_AND_USAGE_GUIDE.md` for detailed explanations.
