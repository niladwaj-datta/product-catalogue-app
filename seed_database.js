const fs = require("node:fs");
const vm = require("node:vm");
const { MongoClient } = require("mongodb");
require("dotenv").config();

const MONGODB_URI = process.env.MONGODB_URI;
const DB_NAME = "Product";
const COLLECTION_NAME = "product-catalogue";

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI is required in .env");
}

function extractProducts(source) {
  const marker = "db.products.insertMany([";
  const start = source.indexOf(marker);
  if (start === -1) {
    throw new Error("Could not find the product data block");
  }

  const arrayStart = source.indexOf("[", start);
  let depth = 0;
  let quote = null;
  let escaped = false;

  for (let index = arrayStart; index < source.length; index += 1) {
    const character = source[index];

    if (quote) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === quote) {
        quote = null;
      }
      continue;
    }

    if (character === '"' || character === "'") {
      quote = character;
    } else if (character === "[") {
      depth += 1;
    } else if (character === "]") {
      depth -= 1;
      if (depth === 0) {
        const arraySource = source.slice(arrayStart, index + 1);
        return vm.runInNewContext(`(${arraySource})`, { Date });
      }
    }
  }

  throw new Error("Could not parse the product data block");
}

async function seedDatabase() {
  const source = fs.readFileSync("mongodb_product_catalogue.js", "utf8");
  const products = extractProducts(source);
  const client = new MongoClient(MONGODB_URI);

  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const existingCollections = await db.listCollections({ name: COLLECTION_NAME }).toArray();

    if (existingCollections.length === 0) {
      await db.createCollection(COLLECTION_NAME, {
        validator: {
          $jsonSchema: {
            bsonType: "object",
            required: ["productId", "name", "description", "category", "price", "stock", "rating"],
            properties: {
              productId: { bsonType: "int" },
              name: { bsonType: "string", minLength: 3, maxLength: 200 },
              description: { bsonType: "string", minLength: 10, maxLength: 1000 },
              category: { bsonType: "object" },
              price: { bsonType: "object" },
              stock: { bsonType: "object" },
              rating: { bsonType: "object" }
            }
          }
        }
      });
    }

    const collection = db.collection(COLLECTION_NAME);
    const existingSample = await collection.findOne();
    if (existingSample && !existingSample.productId && existingSample.sku) {
      await collection.createIndex({
        name: "text",
        description: "text",
        tags: "text",
        category: "text",
        subcategory: "text"
      });
      console.log(`Existing catalogue detected: ${await collection.countDocuments()} products. No documents changed.`);
      return;
    }

    await collection.createIndex({ productId: 1 }, { unique: true });
    await collection.createIndex({ "category.mainCategory": 1, "category.subCategory": 1 });
    await collection.createIndex({ "price.sellingPrice": 1, "rating.average": -1 });
    await collection.createIndex({ "stock.quantity": 1 });
    await collection.createIndex({ isActive: 1 });
    await collection.createIndex({ createdAt: -1 });
    await collection.createIndex({
      name: "text",
      description: "text",
      "category.tags": "text",
      manufacturer: "text"
    });

    let inserted = 0;
    for (const product of products) {
      const result = await collection.updateOne(
        { productId: product.productId },
        { $setOnInsert: product },
        { upsert: true }
      );
      inserted += result.upsertedCount;
    }

    const total = await collection.countDocuments();
    console.log(`Seed complete: ${inserted} inserted, ${total} total products.`);
  } finally {
    await client.close();
  }
}

seedDatabase().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exitCode = 1;
});
