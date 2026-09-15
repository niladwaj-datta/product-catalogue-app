# MongoDB Product Catalogue - Complete Setup & Usage Guide
**For: BTech 2nd Year Students | Database Design Project**

---

## 📋 Table of Contents
1. [Quick Start](#quick-start)
2. [Database Schema Design](#database-schema-design)
3. [Installation & Setup](#installation--setup)
4. [Sample Queries](#sample-queries)
5. [CRUD Operations](#crud-operations)
6. [Best Practices](#best-practices)
7. [Aggregation Pipelines](#aggregation-pipelines)

---

## 🚀 Quick Start

### Prerequisites
- MongoDB 4.4+ installed locally
- MongoDB Compass (optional, but recommended for visualization)
- Node.js + npm (for JavaScript driver integration)

### Import Data (30 seconds)
```bash
# Method 1: Copy-paste entire file in mongo shell
mongo < mongodb_product_catalogue.js

# Method 2: Using mongoimport (if you have JSON file)
mongoimport --db productDB --collection products --file products.json
```

---

## 📊 Database Schema Design

### Why This Design?

#### 1. **Denormalization Strategy**
```javascript
// ✅ Good: Related category data embedded (read-optimized)
category: {
  mainCategory: "Electronics",
  subCategory: "Laptops",
  tags: ["macOS", "professional"]
}

// ❌ Avoid: Separate collection lookups for each read
```

**Reason:** E-commerce reads products **100x more** than they update categories. Embedding improves query performance.

---

#### 2. **Pricing Structure**
```javascript
price: {
  MRP: 249999,              // Maximum Retail Price (original)
  sellingPrice: 224999,     // Current selling price
  discount: 10,             // Discount percentage
  currency: "INR"
}
```

**Why separate fields?**
- Enables quick discount calculations
- Historical tracking possible
- Easy filtering by discount range
- Supports multi-currency in future

---

#### 3. **Stock Management**
```javascript
stock: {
  quantity: 15,           // Current available units
  unit: "pieces",         // Unit type (pieces, kg, liters, etc)
  reorderLevel: 5         // Threshold for re-ordering
}
```

**Advantage:** Atomic updates for inventory operations

---

#### 4. **Rating System**
```javascript
rating: {
  average: 4.8,           // 0-5 scale
  reviewCount: 342        // Social proof metric
}
```

**Use Case:** 
- Sort by popularity: `{rating.reviewCount: -1}`
- Quality filter: `{rating.average: {$gte: 4.5}}`

---

### Collection Validation Rules

```javascript
// Required Fields (always present)
required: [
  "productId", "name", "category",
  "price", "stock", "rating", "description"
]

// Field Constraints
name:           minLength: 3, maxLength: 200
description:    minLength: 10, maxLength: 1000
price fields:   type: double (supports 0.01 precision)
```

---

## 🛠️ Installation & Setup

### Step 1: Start MongoDB Service
```bash
# macOS/Linux
mongod

# Windows
net start MongoDB

# Docker (if installed)
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

### Step 2: Connect to MongoDB
```bash
# Open terminal 2
mongo
# or
mongosh  # (newer MongoDB versions)
```

### Step 3: Load Product Data
```javascript
// Paste entire content of mongodb_product_catalogue.js
// and press Enter
```

### Step 4: Verify Installation
```javascript
use productDB;
db.products.countDocuments();  // Should return: 20
db.products.getIndexes();      // Should show 8 indexes
```

---

## 🔍 Sample Queries

### 1. **Find Products by Price Range**
```javascript
// Find products between ₹100k - ₹200k
db.products.find({
  "price.sellingPrice": { 
    $gte: 100000, 
    $lte: 200000 
  }
}).projection({
  name: 1,
  "price.sellingPrice": 1,
  "rating.average": 1
});
```

**Output:**
```
MacBook Pro 16" M3 Max - ₹224,999 (⭐4.8)
Dell XPS 13 Plus - ₹129,999 (⭐4.6)
...
```

---

### 2. **Filter by Category with Stock Check**
```javascript
// Find available Laptops (stock > 0)
db.products.find({
  "category.mainCategory": "Electronics",
  "category.subCategory": "Laptops",
  "stock.quantity": { $gt: 0 }
}).sort({
  "rating.average": -1  // Sort by ratings descending
});
```

---

### 3. **Text Search Products**
```javascript
// Search for "wireless" in name, description, tags
db.products.find({
  $text: { $search: "wireless" }
}).projection({
  name: 1,
  score: { $meta: "textScore" }
}).sort({
  score: { $meta: "textScore" }
});
```

**Returns:**
- Sony WH-1000XM5
- Fitbit Charge 6
- Samsung Galaxy Watch 6
- JBL Flip 6

---

### 4. **Find Products with Discount > 15%**
```javascript
db.products.find({
  "price.discount": { $gt: 15 }
}).sort({
  "price.discount": -1
}).projection({
  name: 1,
  "price.MRP": 1,
  "price.sellingPrice": 1,
  "price.discount": 1
});
```

---

### 5. **Get High-Rated Products (Rating >= 4.7)**
```javascript
db.products.find({
  "rating.average": { $gte: 4.7 }
}).sort({
  "rating.reviewCount": -1  // Most reviewed first
});
```

**Why `reviewCount` sort?** Reviews > 500 are more statistically reliable than reviews < 50

---

## ✏️ CRUD Operations

### CREATE: Insert New Product
```javascript
db.products.insertOne({
  productId: 1021,
  name: "OnePlus 12 Pro",
  description: "Flagship smartphone with Snapdragon 8 Gen 3...",
  category: {
    mainCategory: "Electronics",
    subCategory: "Smartphones",
    tags: ["Android", "5G", "gaming"]
  },
  price: {
    MRP: 89999,
    sellingPrice: 79999,
    discount: 11,
    currency: "INR"
  },
  stock: {
    quantity: 50,
    unit: "pieces",
    reorderLevel: 10
  },
  rating: {
    average: 4.6,
    reviewCount: 245
  },
  specifications: [
    { spec: "Processor", value: "Snapdragon 8 Gen 3" },
    { spec: "RAM", value: "12GB" },
    { spec: "Storage", value: "256GB" },
    { spec: "Display", value: "6.7-inch AMOLED" }
  ],
  images: ["/img/products/oneplus-12-pro.jpg"],
  manufacturer: "OnePlus Technology",
  warranty: "1 Year Manufacturer Warranty",
  createdAt: new Date(),
  updatedAt: new Date(),
  isActive: true
});
```

---

### READ: Find Products
```javascript
// Find single product
db.products.findOne({ productId: 1001 });

// Find with filters
db.products.find({
  "category.mainCategory": "Electronics"
}).limit(10);

// Count documents
db.products.countDocuments({ isActive: true });
```

---

### UPDATE: Modify Existing Product

#### Update Stock After Sale
```javascript
db.products.updateOne(
  { productId: 1001 },
  {
    $set: { updatedAt: new Date() },
    $inc: { "stock.quantity": -1 }  // Decrease by 1
  }
);
```

#### Update Price (Discount Sale)
```javascript
db.products.updateOne(
  { productId: 1003 },
  {
    $set: {
      "price.discount": 25,
      "price.sellingPrice": 26249,  // Recalculated
      updatedAt: new Date()
    }
  }
);
```

#### Bulk Update: Increase All Electronics Prices by 5%
```javascript
db.products.updateMany(
  { "category.mainCategory": "Electronics" },
  [
    {
      $set: {
        "price.sellingPrice": {
          $multiply: ["$price.sellingPrice", 1.05]
        },
        updatedAt: new Date()
      }
    }
  ]
);
```

---

### DELETE: Remove Products

#### Delete Single Product
```javascript
db.products.deleteOne({ productId: 1099 });
```

#### Soft Delete (Mark Inactive)
```javascript
// Better approach for e-commerce (preserve history)
db.products.updateOne(
  { productId: 1001 },
  { $set: { isActive: false, updatedAt: new Date() } }
);
```

#### Delete All Inactive Products
```javascript
db.products.deleteMany({ isActive: false });
```

---

## 📈 Best Practices

### 1. **Use Projection to Reduce Data Transfer**
```javascript
// ❌ Wasteful: Fetches all fields
db.products.find({ "category.mainCategory": "Electronics" });

// ✅ Efficient: Only fetches needed fields
db.products.find(
  { "category.mainCategory": "Electronics" },
  { name: 1, "price.sellingPrice": 1, "rating.average": 1 }
);
```

**Memory saved:** ~70-80% for large collections

---

### 2. **Index Important Queries**
```javascript
// Query pattern: Filter by category + sort by rating
// Add compound index
db.products.createIndex({
  "category.mainCategory": 1,
  "rating.average": -1
});

// Verify index usage
db.products.find({
  "category.mainCategory": "Electronics"
}).sort({ "rating.average": -1 }).explain("executionStats");
// Look for "executionStages.stage": "COLLSCAN" (bad) vs "IXSCAN" (good)
```

---

### 3. **Use Bulk Operations for Multiple Updates**
```javascript
const bulkOps = [
  {
    updateOne: {
      filter: { productId: 1001 },
      update: { $inc: { "stock.quantity": -5 } }
    }
  },
  {
    updateOne: {
      filter: { productId: 1002 },
      update: { $inc: { "stock.quantity": -3 } }
    }
  }
];

db.products.bulkWrite(bulkOps);
```

**Performance:** 10-100x faster than individual updates

---

### 4. **Pagination for Large Result Sets**
```javascript
// Page 1 (products 1-10)
const page = 1;
const pageSize = 10;
const skip = (page - 1) * pageSize;

db.products.find()
  .sort({ createdAt: -1 })
  .skip(skip)
  .limit(pageSize);
```

---

### 5. **Transaction Safety (MongoDB 4.0+)**
```javascript
// Ensure consistency across multiple operations
const session = db.getMongo().startSession();
session.startTransaction();

try {
  db.products.updateOne(
    { productId: 1001 },
    { $inc: { "stock.quantity": -1 } },
    { session: session }
  );
  
  // Log transaction in orders collection
  db.orders.insertOne(
    { productId: 1001, quantity: 1, timestamp: new Date() },
    { session: session }
  );
  
  session.commitTransaction();
} catch (error) {
  session.abortTransaction();
  throw error;
} finally {
  session.endSession();
}
```

---

## 📊 Aggregation Pipelines

### 1. **Category-wise Revenue Analysis**
```javascript
db.products.aggregate([
  // Stage 1: Filter active products
  { $match: { isActive: true } },
  
  // Stage 2: Group by category and calculate revenue
  {
    $group: {
      _id: "$category.mainCategory",
      totalRevenue: {
        $sum: {
          $multiply: ["$price.sellingPrice", "$stock.quantity"]
        }
      },
      averageRating: { $avg: "$rating.average" },
      productCount: { $sum: 1 }
    }
  },
  
  // Stage 3: Sort by revenue
  { $sort: { totalRevenue: -1 } }
]);
```

**Output:**
```
{
  _id: "Electronics",
  totalRevenue: 15847500,
  averageRating: 4.63,
  productCount: 12
}
```

---

### 2. **Find Best-Selling Products (High Stock + High Rating)**
```javascript
db.products.aggregate([
  {
    $addFields: {
      // Calculate a score based on rating and reviews
      popularityScore: {
        $multiply: [
          { $divide: ["$rating.average", 5] },  // Rating weight
          { $log: [{ $max: ["$rating.reviewCount", 1] }] }  // Review count weight
        ]
      }
    }
  },
  { $sort: { popularityScore: -1 } },
  {
    $project: {
      name: 1,
      "rating.average": 1,
      "rating.reviewCount": 1,
      popularityScore: 1
    }
  },
  { $limit: 10 }
]);
```

---

### 3. **Price Range Distribution**
```javascript
db.products.aggregate([
  {
    $bucket: {
      groupBy: "$price.sellingPrice",
      boundaries: [0, 50000, 100000, 200000, 500000],
      default: "Above 500k",
      output: {
        count: { $sum: 1 },
        products: { $push: "$name" }
      }
    }
  }
]);
```

**Output:**
```
{
  _id: 0,
  count: 8,
  products: ["JBL Flip 6", "Kindle Paperwhite", ...]
}
```

---

### 4. **Discount Impact Analysis**
```javascript
db.products.aggregate([
  {
    $group: {
      _id: {
        $cond: [
          { $gte: ["$price.discount", 20] },
          "High Discount (≥20%)",
          "Normal Discount (<20%)"
        ]
      },
      count: { $sum: 1 },
      avgRating: { $avg: "$rating.average" },
      avgReviews: { $avg: "$rating.reviewCount" }
    }
  }
]);
```

---

## 🎓 Learning Outcomes

After completing this project, you'll understand:

✅ **NoSQL Database Design**
- When to denormalize vs normalize
- Embedding vs referencing data
- Index strategy for query optimization

✅ **MongoDB Operations**
- CRUD operations
- Query filters and projections
- Aggregation pipelines
- Index creation and usage

✅ **Real-world E-commerce Concepts**
- Product catalog structure
- Inventory management
- Price/discount handling
- Customer rating systems

✅ **Performance Optimization**
- Index selection
- Query execution plans
- Bulk operations
- Pagination strategies

---

## 🐛 Troubleshooting

### Issue: "Collection already exists"
```javascript
db.products.drop();  // Remove old collection
// Then re-run insertion script
```

### Issue: "Index already exists"
```javascript
db.products.dropIndex("productId_1");  // Drop specific index
db.products.dropIndexes();             // Drop all indexes
```

### Issue: "Can't insert due to validation error"
```javascript
// Check collection validation rules
db.getCollectionInfos({ name: "products" });

// Remove validation temporarily
db.runCommand({
  collMod: "products",
  validator: {}
});
```

---

## 📚 References

- [MongoDB Official Docs](https://docs.mongodb.com/)
- [Aggregation Pipeline](https://docs.mongodb.com/manual/core/aggregation-pipeline/)
- [Index Strategy](https://docs.mongodb.com/manual/indexes/)
- [Schema Design Guide](https://www.mongodb.com/docs/manual/core/data-model-design/)

---

## 👨‍💼 Evaluation Checklist

For your project submission:

- [ ] Database created with schema validation
- [ ] All 20 products inserted successfully
- [ ] Indexes created for performance
- [ ] 5+ CRUD operations demonstrated
- [ ] 3+ Aggregation pipelines working
- [ ] Query performance analysis (explain plans)
- [ ] Documentation of design decisions
- [ ] Code comments explaining each section

---

**Good luck with your project!** 🚀
