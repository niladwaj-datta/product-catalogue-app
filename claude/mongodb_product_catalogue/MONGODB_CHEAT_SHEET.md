# MongoDB Product Catalogue - Quick Reference Cheat Sheet

## 🔌 Connection & Setup

```bash
# Start MongoDB
mongod

# Connect to MongoDB
mongo
mongosh  # (new versions)

# Start specific port
mongod --port 27017
```

---

## 📂 Database & Collection Commands

```javascript
// Create/switch to database
use productDB;

// Show databases
show dbs;

// Show collections
show collections;

// Get collection stats
db.products.stats();

// Get collection info
db.getCollectionInfos({ name: "products" });
```

---

## ➕ CREATE Operations

### Insert Single Document
```javascript
db.products.insertOne({
  productId: 1021,
  name: "Product Name",
  category: { mainCategory: "Electronics", subCategory: "Laptops" },
  price: { MRP: 100000, sellingPrice: 90000, discount: 10, currency: "INR" },
  stock: { quantity: 10, unit: "pieces", reorderLevel: 5 },
  rating: { average: 4.5, reviewCount: 100 },
  createdAt: new Date(),
  isActive: true
});
```

### Insert Multiple Documents
```javascript
db.products.insertMany([
  { productId: 1021, name: "Product 1", ... },
  { productId: 1022, name: "Product 2", ... }
]);
```

### Bulk Insert with Error Handling
```javascript
db.products.insertMany([...], { ordered: false });
// ordered: false = continue on error
```

---

## 🔍 READ Operations

### Find All Documents
```javascript
db.products.find();
```

### Find with Single Condition
```javascript
// Equal to
db.products.find({ "category.mainCategory": "Electronics" });

// Not equal
db.products.find({ "category.mainCategory": { $ne: "Electronics" } });
```

### Find with Multiple Conditions (AND)
```javascript
db.products.find({
  "category.mainCategory": "Electronics",
  "stock.quantity": { $gt: 0 }
});
```

### Find with Multiple Conditions (OR)
```javascript
db.products.find({
  $or: [
    { "category.mainCategory": "Electronics" },
    { "category.mainCategory": "Fashion" }
  ]
});
```

### Price Range Query
```javascript
// Price between ₹50k and ₹200k
db.products.find({
  "price.sellingPrice": { $gte: 50000, $lte: 200000 }
});

// Operators:
// $gt  - Greater than
// $gte - Greater than or equal
// $lt  - Less than
// $lte - Less than or equal
```

### Find Single Document
```javascript
db.products.findOne({ productId: 1001 });
```

### Text Search
```javascript
db.products.find({ $text: { $search: "wireless" } });

// Multi-word search
db.products.find({ $text: { $search: "laptop computer" } });

// Exact phrase
db.products.find({ $text: { $search: "\"MacBook Pro\"" } });

// Exclude word (negative search)
db.products.find({ $text: { $search: "laptop -Dell" } });
```

### Array Search
```javascript
// Contains tag
db.products.find({ "category.tags": "wireless" });

// Any of multiple tags
db.products.find({ "category.tags": { $in: ["wireless", "5G"] } });

// All tags
db.products.find({ "category.tags": { $all: ["wireless", "Bluetooth"] } });
```

### Projection (Select Specific Fields)
```javascript
// Include only these fields
db.products.find({}, { name: 1, "price.sellingPrice": 1 });

// Exclude specific fields
db.products.find({}, { description: 0, specifications: 0 });

// With calculated field
db.products.find({}, { name: 1, savings: { $subtract: ["$price.MRP", "$price.sellingPrice"] } });
```

### Sorting
```javascript
// Ascending (A-Z, 0-9)
db.products.find().sort({ name: 1 });

// Descending (Z-A, 9-0)
db.products.find().sort({ "rating.average": -1 });

// Multiple fields
db.products.find()
  .sort({ "category.mainCategory": 1, "rating.average": -1 });
```

### Pagination
```javascript
const page = 2;
const pageSize = 10;

db.products.find()
  .skip((page - 1) * pageSize)
  .limit(pageSize);
```

### Counting
```javascript
db.products.countDocuments();  // Total documents

db.products.countDocuments({ isActive: true });  // With filter

db.products.estimatedDocumentCount();  // Fast estimate (all documents)
```

### Limit & Skip
```javascript
db.products.find().limit(10);  // First 10 documents

db.products.find().skip(20);   // Skip first 20

db.products.find().limit(10).skip(20);  // Pagination: page 3, 10 items per page
```

---

## ✏️ UPDATE Operations

### Update Single Field
```javascript
db.products.updateOne(
  { productId: 1001 },  // Filter
  { $set: { "stock.quantity": 20 } }  // Update
);
```

### Update Multiple Fields
```javascript
db.products.updateOne(
  { productId: 1001 },
  {
    $set: {
      "price.sellingPrice": 89999,
      "price.discount": 15,
      updatedAt: new Date()
    }
  }
);
```

### Increment/Decrement
```javascript
// Decrease stock after sale
db.products.updateOne(
  { productId: 1001 },
  { $inc: { "stock.quantity": -1 } }
);

// Increase by multiple
db.products.updateOne(
  { productId: 1001 },
  { $inc: { "rating.reviewCount": 5 } }
);
```

### Multiply Value
```javascript
db.products.updateOne(
  { productId: 1001 },
  { $mul: { "price.sellingPrice": 1.05 } }  // Increase by 5%
);
```

### Update Multiple Documents
```javascript
db.products.updateMany(
  { "category.mainCategory": "Electronics" },
  { $set: { "price.discount": 20 } }
);
```

### Array Operations

#### Push to Array
```javascript
db.products.updateOne(
  { productId: 1001 },
  { $push: { images: "/new-image.jpg" } }
);
```

#### Push Multiple to Array
```javascript
db.products.updateOne(
  { productId: 1001 },
  { $push: { "category.tags": { $each: ["new", "tag"] } } }
);
```

#### Remove from Array
```javascript
db.products.updateOne(
  { productId: 1001 },
  { $pull: { images: "/image-to-remove.jpg" } }
);
```

### Find and Update (Returns Updated Document)
```javascript
db.products.findOneAndUpdate(
  { productId: 1001 },
  { $set: { "stock.quantity": 15 } },
  { returnDocument: "after" }  // Return updated doc
);
```

### Bulk Update
```javascript
const bulkOps = [
  { updateOne: { filter: { productId: 1001 }, update: { $inc: { "stock.quantity": -1 } } } },
  { updateOne: { filter: { productId: 1002 }, update: { $inc: { "stock.quantity": -2 } } } }
];
db.products.bulkWrite(bulkOps);
```

### Replace Entire Document
```javascript
db.products.replaceOne(
  { productId: 1001 },
  { new: "document", with: "all", fields: "replaced" }
);
```

---

## ❌ DELETE Operations

### Delete Single Document
```javascript
db.products.deleteOne({ productId: 1001 });
```

### Delete Multiple Documents
```javascript
db.products.deleteMany({ "category.mainCategory": "Electronics" });

// Delete all
db.products.deleteMany({});
```

### Soft Delete (Mark Inactive - Recommended for E-commerce)
```javascript
db.products.updateOne(
  { productId: 1001 },
  { $set: { isActive: false, updatedAt: new Date() } }
);

// Query active products only
db.products.find({ isActive: true });
```

### Find and Delete (Returns Deleted Document)
```javascript
db.products.findOneAndDelete({ productId: 1001 });
```

---

## 📊 AGGREGATION Pipeline

### Basic Structure
```javascript
db.products.aggregate([
  { $stage1: { ... } },
  { $stage2: { ... } },
  { $stage3: { ... } }
]);
```

### $match - Filter Documents
```javascript
db.products.aggregate([
  { $match: { isActive: true, "price.sellingPrice": { $lt: 100000 } } }
]);
```

### $group - Group & Calculate
```javascript
db.products.aggregate([
  {
    $group: {
      _id: "$category.mainCategory",        // Group by field
      count: { $sum: 1 },                   // Count documents
      avgPrice: { $avg: "$price.sellingPrice" },  // Average
      maxRating: { $max: "$rating.average" },     // Maximum
      minRating: { $min: "$rating.average" },     // Minimum
      totalStock: { $sum: "$stock.quantity" }    // Total
    }
  }
]);
```

### $sort - Order Results
```javascript
db.products.aggregate([
  { $match: { isActive: true } },
  { $sort: { "rating.average": -1 } }  // -1 = descending, 1 = ascending
]);
```

### $limit - Limit Results
```javascript
db.products.aggregate([
  { $match: { isActive: true } },
  { $limit: 10 }
]);
```

### $skip - Skip Results
```javascript
db.products.aggregate([
  { $skip: 20 },
  { $limit: 10 }  // Pagination: page 3
]);
```

### $project - Select/Calculate Fields
```javascript
db.products.aggregate([
  {
    $project: {
      name: 1,
      "price.sellingPrice": 1,
      savings: { $subtract: ["$price.MRP", "$price.sellingPrice"] }
    }
  }
]);
```

### $bucket - Group into Ranges
```javascript
db.products.aggregate([
  {
    $bucket: {
      groupBy: "$price.sellingPrice",
      boundaries: [0, 50000, 100000, 200000, 500000],
      default: "Above 500k",
      output: { count: { $sum: 1 }, products: { $push: "$name" } }
    }
  }
]);
```

### $facet - Multiple Aggregations
```javascript
db.products.aggregate([
  {
    $facet: {
      byCategory: [ { $group: { _id: "$category.mainCategory", count: { $sum: 1 } } } ],
      byRating: [ { $group: { _id: null, avgRating: { $avg: "$rating.average" } } } ]
    }
  }
]);
```

### Real Example: Revenue Analysis
```javascript
db.products.aggregate([
  { $match: { isActive: true } },
  {
    $group: {
      _id: "$category.mainCategory",
      totalRevenue: { $sum: { $multiply: ["$price.sellingPrice", "$stock.quantity"] } },
      productCount: { $sum: 1 },
      avgRating: { $avg: "$rating.average" }
    }
  },
  { $sort: { totalRevenue: -1 } }
]);
```

---

## 🏗️ INDEX Operations

### Create Indexes

#### Single Field Index
```javascript
db.products.createIndex({ productId: 1 });
db.products.createIndex({ name: 1 });
```

#### Ascending vs Descending
```javascript
db.products.createIndex({ "price.sellingPrice": 1 });   // Ascending
db.products.createIndex({ "rating.average": -1 });      // Descending
```

#### Compound Index (Multiple Fields)
```javascript
db.products.createIndex({
  "category.mainCategory": 1,
  "rating.average": -1
});
```

#### Text Index
```javascript
db.products.createIndex({
  name: "text",
  description: "text",
  "category.tags": "text",
  manufacturer: "text"
});
```

### List Indexes
```javascript
db.products.getIndexes();
```

### Remove Indexes
```javascript
db.products.dropIndex("productId_1");
db.products.dropIndexes();  // Drop all (except _id)
```

### Analyze Query Performance
```javascript
db.products.find({ "category.mainCategory": "Electronics" })
  .explain("executionStats");

// Look for:
// COLLSCAN = Bad (collection scan, no index)
// IXSCAN = Good (index scan)
// executionStats.executionStages.nReturned = Documents examined
// executionStats.totalDocsExamined = Documents scanned
```

---

## 💾 Backup & Restore

### Backup Database
```bash
# Backup entire database
mongodump --db productDB --out backup/

# Backup collection
mongodump --db productDB --collection products --out backup/
```

### Restore Database
```bash
# Restore entire database
mongorestore --db productDB backup/productDB/

# Restore collection
mongorestore --db productDB --collection products backup/productDB/products.bson
```

### Export/Import JSON
```bash
# Export
mongoexport --db productDB --collection products --out products.json

# Import
mongoimport --db productDB --collection products --file products.json
```

---

## ⚡ Performance Tips

### 1. Use Indexes for Common Queries
```javascript
// Slow: Full collection scan
db.products.find({ "category.mainCategory": "Electronics" });

// Fast: With index
db.products.createIndex({ "category.mainCategory": 1 });
```

### 2. Project Only Needed Fields
```javascript
// Wasteful
db.products.find({ "category.mainCategory": "Electronics" });

// Efficient
db.products.find(
  { "category.mainCategory": "Electronics" },
  { name: 1, "price.sellingPrice": 1 }
);
```

### 3. Use Projection in Aggregation
```javascript
db.products.aggregate([
  { $match: { isActive: true } },
  { $project: { name: 1, price: 1 } },  // Early projection
  { $group: { _id: null, count: { $sum: 1 } } }
]);
```

### 4. Paginate Large Result Sets
```javascript
// Bad: Get all, sort, then limit
db.products.find().sort({ "rating.average": -1 });

// Good: Limit first
db.products.find()
  .sort({ "rating.average": -1 })
  .skip(0)
  .limit(10);
```

### 5. Use Bulk Operations
```javascript
// Bad: Multiple updateOne calls
for (let i = 1001; i <= 1010; i++) {
  db.products.updateOne({ productId: i }, { $inc: { stock: -1 } });
}

// Good: Single bulkWrite
const ops = [];
for (let i = 1001; i <= 1010; i++) {
  ops.push({ updateOne: { filter: { productId: i }, update: { $inc: { stock: -1 } } } });
}
db.products.bulkWrite(ops);
```

---

## 🐛 Common Patterns

### Check if Field Exists
```javascript
db.products.find({ specifications: { $exists: true } });
db.products.find({ specifications: { $exists: false } });
```

### Check Array Length
```javascript
db.products.find({ images: { $size: 3 } });
```

### Complex Filter Expression
```javascript
db.products.find({
  $expr: {
    $gt: ["$stock.quantity", "$stock.reorderLevel"]
  }
});
```

### Update with Conditional Logic
```javascript
db.products.updateOne(
  { productId: 1001 },
  [
    {
      $set: {
        "price.discount": {
          $cond: [
            { $gte: ["$price.discount", 20] },
            25,  // Increase if already high discount
            { $add: ["$price.discount", 5] }  // Otherwise add 5%
          ]
        }
      }
    }
  ]
);
```

---

## 📞 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| Connection refused | Start MongoDB: `mongod` |
| Collection not found | Check database: `use productDB; show collections;` |
| Index already exists | Drop it: `db.products.dropIndex("indexName")` |
| Validation error on insert | Remove validation: `db.runCommand({collMod: "products", validator: {}})` |
| Slow query | Add index: `db.products.createIndex({field: 1})` |
| Text search not working | Create text index: `db.products.createIndex({field: "text"})` |

---

## 🎯 Common Query Patterns (Copy-Paste Ready)

### Pattern 1: Filter by Category + Sort by Rating
```javascript
db.products.find({
  "category.mainCategory": "Electronics",
  isActive: true
}).sort({ "rating.average": -1 }).limit(10);
```

### Pattern 2: Price Range + High Rating
```javascript
db.products.find({
  "price.sellingPrice": { $gte: 50000, $lte: 200000 },
  "rating.average": { $gte: 4.5 }
}).sort({ "price.sellingPrice": 1 });
```

### Pattern 3: Search + Filter
```javascript
db.products.find({
  $text: { $search: "laptop" },
  isActive: true,
  "price.discount": { $gte: 10 }
}).limit(20);
```

### Pattern 4: Stock Check + By Category
```javascript
db.products.find({
  "stock.quantity": { $lte: "$stock.reorderLevel" },
  "category.mainCategory": "Electronics"
}).sort({ "stock.quantity": 1 });
```

### Pattern 5: Revenue Analysis
```javascript
db.products.aggregate([
  { $match: { isActive: true } },
  { $group: { _id: "$category.mainCategory", revenue: { $sum: { $multiply: ["$price.sellingPrice", "$stock.quantity"] } } } },
  { $sort: { revenue: -1 } }
]);
```

---

**Print this page for quick reference during coding!** 🖨️
