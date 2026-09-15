/**
 * MongoDB Product Catalogue Collection
 * ===========================================
 * 
 * Purpose: Sample product database for e-commerce platform
 * Database: Product
 * Collection: product-catalogue
 * 
 * Schema Design Principles:
 * - Denormalization for commonly accessed data (category details embedded)
 * - Efficient indexing for search & filtering operations
 * - Proper data validation with realistic constraints
 * - Support for pagination, filtering, sorting
 * 
 * Usage:
 * 1. Start MongoDB: mongod
 * 2. Connect: mongo
 * 3. Copy & paste all code below in mongo shell
 * 4. Or: mongoimport --db productDB --collection products --file mongodb_product_catalogue.json
 */

// ===== STEP 1: Switch to Database =====
use Product;

// ===== STEP 2: Create Collection with Schema Validation =====
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

// ===== STEP 3: Insert 20 Realistic Products =====
db.products.insertMany([
  {
    productId: 1001,
    name: "MacBook Pro 16\" M3 Max",
    description:
      "Premium laptop with Apple M3 Max chip, 16GB unified memory, 512GB SSD storage, stunning Liquid Retina XDR display for professionals and developers",
    category: {
      mainCategory: "Electronics",
      subCategory: "Laptops",
      tags: ["macOS", "professional", "high-performance", "2024"]
    },
    price: {
      MRP: 249999,
      sellingPrice: 224999,
      discount: 10,
      currency: "INR"
    },
    stock: { quantity: 15, unit: "pieces", reorderLevel: 5 },
    rating: { average: 4.8, reviewCount: 342 },
    specifications: [
      { spec: "Processor", value: "Apple M3 Max 12-core" },
      { spec: "RAM", value: "16GB Unified Memory" },
      { spec: "Storage", value: "512GB SSD" },
      { spec: "Display", value: "16-inch Liquid Retina XDR" },
      { spec: "Battery", value: "Up to 18 hours" }
    ],
    images: [
      "/img/products/macbook-pro-16-m3.jpg",
      "/img/products/macbook-pro-16-m3-side.jpg"
    ],
    manufacturer: "Apple Inc.",
    warranty: "1 Year Limited Warranty + AppleCare+ available",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-09-10"),
    isActive: true
  },

  {
    productId: 1002,
    name: "Dell XPS 13 Plus",
    description:
      "Ultra-portable laptop with Intel Core i7, 16GB RAM, 512GB SSD, stunning OLED display and premium aluminum chassis",
    category: {
      mainCategory: "Electronics",
      subCategory: "Laptops",
      tags: ["Windows", "portable", "high-performance", "OLED"]
    },
    price: {
      MRP: 149999,
      sellingPrice: 129999,
      discount: 13,
      currency: "INR"
    },
    stock: { quantity: 28, unit: "pieces", reorderLevel: 8 },
    rating: { average: 4.6, reviewCount: 256 },
    specifications: [
      { spec: "Processor", value: "Intel Core i7-1360P" },
      { spec: "RAM", value: "16GB LPDDR5" },
      { spec: "Storage", value: "512GB SSD" },
      { spec: "Display", value: "13.3-inch OLED" },
      { spec: "Weight", value: "1.16 kg" }
    ],
    images: [
      "/img/products/dell-xps-13-plus.jpg",
      "/img/products/dell-xps-13-plus-open.jpg"
    ],
    manufacturer: "Dell Technologies",
    warranty: "1 Year Premium Support",
    createdAt: new Date("2024-02-20"),
    updatedAt: new Date("2024-09-08"),
    isActive: true
  },

  {
    productId: 1003,
    name: "Sony WH-1000XM5 Headphones",
    description:
      "Industry-leading noise-cancelling wireless headphones with premium sound quality, 30-hour battery life, and Bluetooth 5.3",
    category: {
      mainCategory: "Electronics",
      subCategory: "Audio",
      tags: ["wireless", "noise-cancelling", "premium", "Bluetooth"]
    },
    price: {
      MRP: 34999,
      sellingPrice: 27999,
      discount: 20,
      currency: "INR"
    },
    stock: { quantity: 52, unit: "pieces", reorderLevel: 10 },
    rating: { average: 4.7, reviewCount: 1205 },
    specifications: [
      { spec: "Noise Cancellation", value: "Industry-leading ANC" },
      { spec: "Battery", value: "30 hours playback" },
      { spec: "Connectivity", value: "Bluetooth 5.3 + 3.5mm jack" },
      { spec: "Driver", value: "40mm Dynamic Driver" },
      { spec: "Weight", value: "250g" }
    ],
    images: [
      "/img/products/sony-wh1000xm5.jpg",
      "/img/products/sony-wh1000xm5-side.jpg",
      "/img/products/sony-wh1000xm5-detail.jpg"
    ],
    manufacturer: "Sony Corporation",
    warranty: "1 Year Manufacturer Warranty",
    createdAt: new Date("2024-03-10"),
    updatedAt: new Date("2024-09-12"),
    isActive: true
  },

  {
    productId: 1004,
    name: "Samsung 65\" 4K QLED TV",
    description:
      "Crystal UHD 4K QLED Smart TV with quantum dot technology, 120Hz refresh rate, and Samsung SmartThings integration",
    category: {
      mainCategory: "Electronics",
      subCategory: "Televisions",
      tags: ["4K", "QLED", "smart-tv", "120Hz"]
    },
    price: {
      MRP: 149999,
      sellingPrice: 99999,
      discount: 33,
      currency: "INR"
    },
    stock: { quantity: 8, unit: "pieces", reorderLevel: 3 },
    rating: { average: 4.5, reviewCount: 487 },
    specifications: [
      { spec: "Screen Size", value: "65 inches" },
      { spec: "Resolution", value: "4K (3840 x 2160)" },
      { spec: "Refresh Rate", value: "120Hz" },
      { spec: "Panel", value: "QLED Quantum Dot" },
      { spec: "Smart OS", value: "Samsung Tizen" }
    ],
    images: [
      "/img/products/samsung-65-qled.jpg",
      "/img/products/samsung-65-qled-stand.jpg"
    ],
    manufacturer: "Samsung Electronics",
    warranty: "2 Years Full Warranty + In-home Support",
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-09-11"),
    isActive: true
  },

  {
    productId: 1005,
    name: "Apple iPhone 15 Pro Max 256GB",
    description:
      "Latest flagship smartphone with A17 Pro chip, advanced camera system, always-on display, and titanium design",
    category: {
      mainCategory: "Electronics",
      subCategory: "Smartphones",
      tags: ["iOS", "5G", "camera-centric", "premium", "2024"]
    },
    price: {
      MRP: 159999,
      sellingPrice: 149999,
      discount: 6,
      currency: "INR"
    },
    stock: { quantity: 35, unit: "pieces", reorderLevel: 15 },
    rating: { average: 4.9, reviewCount: 2341 },
    specifications: [
      { spec: "Processor", value: "Apple A17 Pro" },
      { spec: "Storage", value: "256GB" },
      { spec: "Display", value: "6.7-inch Super Retina XDR" },
      { spec: "Camera", value: "48MP main + 12MP periscope" },
      { spec: "Battery", value: "4322 mAh" }
    ],
    images: [
      "/img/products/iphone-15-pro-max.jpg",
      "/img/products/iphone-15-pro-max-back.jpg",
      "/img/products/iphone-15-pro-max-colors.jpg"
    ],
    manufacturer: "Apple Inc.",
    warranty: "1 Year Manufacturer Warranty + AppleCare+ available",
    createdAt: new Date("2023-09-22"),
    updatedAt: new Date("2024-09-10"),
    isActive: true
  },

  {
    productId: 1006,
    name: "Canon EOS R6 Mark II",
    description:
      "Professional mirrorless camera with 20MP full-frame sensor, 6K video, advanced autofocus, perfect for photographers",
    category: {
      mainCategory: "Electronics",
      subCategory: "Cameras",
      tags: ["mirrorless", "professional", "4K", "wifi", "full-frame"]
    },
    price: {
      MRP: 419999,
      sellingPrice: 379999,
      discount: 10,
      currency: "INR"
    },
    stock: { quantity: 6, unit: "pieces", reorderLevel: 2 },
    rating: { average: 4.8, reviewCount: 156 },
    specifications: [
      { spec: "Sensor", value: "20.1MP Full-Frame CMOS" },
      { spec: "Video", value: "6K 60fps, 4K 120fps" },
      { spec: "Autofocus", value: "1053 AF points" },
      { spec: "Body", value: "Magnesium alloy, weather-sealed" },
      { spec: "Battery", value: "2970mAh, approx 430 shots" }
    ],
    images: [
      "/img/products/canon-eos-r6-mk2.jpg",
      "/img/products/canon-eos-r6-mk2-top.jpg"
    ],
    manufacturer: "Canon Inc.",
    warranty: "1 Year International Warranty",
    createdAt: new Date("2024-05-15"),
    updatedAt: new Date("2024-09-09"),
    isActive: true
  },

  {
    productId: 1007,
    name: "Dyson V15 Detect Vacuum",
    description:
      "Cordless vacuum cleaner with laser dust detection, HEPA filtration, 60-minute runtime, and adaptive suction power",
    category: {
      mainCategory: "Home & Appliances",
      subCategory: "Cleaning",
      tags: ["cordless", "smart-detection", "HEPA", "lightweight"]
    },
    price: {
      MRP: 89999,
      sellingPrice: 74999,
      discount: 17,
      currency: "INR"
    },
    stock: { quantity: 12, unit: "pieces", reorderLevel: 4 },
    rating: { average: 4.7, reviewCount: 892 },
    specifications: [
      { spec: "Runtime", value: "Up to 60 minutes" },
      { spec: "Suction", value: "240 AW" },
      { spec: "Filtration", value: "HEPA 13" },
      { spec: "Weight", value: "2.36 kg" },
      { spec: "Charging Time", value: "4.5 hours" }
    ],
    images: [
      "/img/products/dyson-v15.jpg",
      "/img/products/dyson-v15-accessories.jpg"
    ],
    manufacturer: "Dyson Ltd",
    warranty: "2 Years Warranty",
    createdAt: new Date("2024-04-20"),
    updatedAt: new Date("2024-09-07"),
    isActive: true
  },

  {
    productId: 1008,
    name: "Kindle Paperwhite 11th Gen",
    description:
      "E-reader with 6.8-inch display, warm light, waterproof design, and storage for thousands of books",
    category: {
      mainCategory: "Electronics",
      subCategory: "Readers",
      tags: ["e-reader", "waterproof", "backlighting", "portable"]
    },
    price: {
      MRP: 16999,
      sellingPrice: 14299,
      discount: 16,
      currency: "INR"
    },
    stock: { quantity: 64, unit: "pieces", reorderLevel: 20 },
    rating: { average: 4.6, reviewCount: 3421 },
    specifications: [
      { spec: "Display", value: "6.8-inch E Ink Gallery" },
      { spec: "Resolution", value: "300 ppi" },
      { spec: "Storage", value: "32GB" },
      { spec: "Battery", value: "6 weeks per charge" },
      { spec: "Waterproof", value: "IPX8" }
    ],
    images: [
      "/img/products/kindle-paperwhite.jpg",
      "/img/products/kindle-paperwhite-side.jpg"
    ],
    manufacturer: "Amazon.com Inc.",
    warranty: "1 Year Limited Warranty",
    createdAt: new Date("2024-06-10"),
    updatedAt: new Date("2024-09-12"),
    isActive: true
  },

  {
    productId: 1009,
    name: "Nike Air Jordan 1 Retro High",
    description:
      "Iconic basketball sneaker with premium leather, Air cushioning, and classic design. Available in multiple colorways",
    category: {
      mainCategory: "Fashion & Footwear",
      subCategory: "Shoes",
      tags: ["basketball", "sneakers", "premium", "iconic"]
    },
    price: {
      MRP: 19999,
      sellingPrice: 15999,
      discount: 20,
      currency: "INR"
    },
    stock: { quantity: 142, unit: "pairs", reorderLevel: 30 },
    rating: { average: 4.8, reviewCount: 5234 },
    specifications: [
      { spec: "Shoe Type", value: "Basketball Sneaker" },
      { spec: "Material", value: "Leather, Synthetic" },
      { spec: "Sole", value: "Rubber" },
      { spec: "Sizes", value: "5-14 (US)" },
      { spec: "Colorways", value: "Chicago Red, Black Toe, Royal Blue" }
    ],
    images: [
      "/img/products/jordan-1-retro.jpg",
      "/img/products/jordan-1-retro-side.jpg",
      "/img/products/jordan-1-retro-colors.jpg"
    ],
    manufacturer: "Nike Inc.",
    warranty: "Manufacturing defects only - 30 days",
    createdAt: new Date("2024-07-05"),
    updatedAt: new Date("2024-09-11"),
    isActive: true
  },

  {
    productId: 1010,
    name: "Levi's Classic Blue Jeans 501",
    description:
      "Timeless denim jeans with classic straight-leg cut, authentic stone wash, and durable cotton fabric. Perfect everyday wear",
    category: {
      mainCategory: "Fashion & Footwear",
      subCategory: "Clothing",
      tags: ["denim", "classic", "casual", "unisex"]
    },
    price: {
      MRP: 8999,
      sellingPrice: 6999,
      discount: 22,
      currency: "INR"
    },
    stock: { quantity: 287, unit: "pieces", reorderLevel: 50 },
    rating: { average: 4.5, reviewCount: 2156 },
    specifications: [
      { spec: "Material", value: "100% Cotton Denim" },
      { spec: "Fit", value: "Straight Leg" },
      { spec: "Wash", value: "Stone Wash Blue" },
      { spec: "Sizes", value: "28-40 (Waist)" },
      { spec: "Care", value: "Machine Wash Cold" }
    ],
    images: [
      "/img/products/levis-501.jpg",
      "/img/products/levis-501-detail.jpg"
    ],
    manufacturer: "Levi Strauss & Co.",
    warranty: "Manufacturing defects only - 60 days",
    createdAt: new Date("2024-03-15"),
    updatedAt: new Date("2024-09-10"),
    isActive: true
  },

  {
    productId: 1011,
    name: "Nespresso Vertuo Pop",
    description:
      "Compact single-serve coffee maker with proprietary barcode scanning, 1260W power, and automatic capsule detection",
    category: {
      mainCategory: "Home & Appliances",
      subCategory: "Kitchen Appliances",
      tags: ["coffee-maker", "compact", "automatic", "espresso"]
    },
    price: {
      MRP: 12999,
      sellingPrice: 9999,
      discount: 23,
      currency: "INR"
    },
    stock: { quantity: 38, unit: "pieces", reorderLevel: 10 },
    rating: { average: 4.4, reviewCount: 678 },
    specifications: [
      { spec: "Power", value: "1260W" },
      { spec: "Capsule", value: "Nespresso Vertuo" },
      { spec: "Water Tank", value: "1.2L" },
      { spec: "Brewing Time", value: "30 seconds" },
      { spec: "Size", value: "Compact (22 x 13 cm)" }
    ],
    images: [
      "/img/products/nespresso-vertuo-pop.jpg",
      "/img/products/nespresso-vertuo-pop-side.jpg"
    ],
    manufacturer: "Nespresso Group",
    warranty: "1 Year Limited Warranty",
    createdAt: new Date("2024-05-20"),
    updatedAt: new Date("2024-09-08"),
    isActive: true
  },

  {
    productId: 1012,
    name: "Instant Pot Duo Plus 9L",
    description:
      "9-in-1 electric pressure cooker and slow cooker with 5.7L capacity, whisper-quiet steam release, and stainless steel construction",
    category: {
      mainCategory: "Home & Appliances",
      subCategory: "Kitchen Appliances",
      tags: ["pressure-cooker", "multi-functional", "stainless-steel", "smart"]
    },
    price: {
      MRP: 19999,
      sellingPrice: 14999,
      discount: 25,
      currency: "INR"
    },
    stock: { quantity: 23, unit: "pieces", reorderLevel: 8 },
    rating: { average: 4.7, reviewCount: 1456 },
    specifications: [
      { spec: "Capacity", value: "5.7L" },
      { spec: "Functions", value: "9-in-1 (Pressure Cooker, Slow Cooker, etc)" },
      { spec: "Power", value: "1000W" },
      { spec: "Material", value: "Stainless Steel" },
      { spec: "Safety", value: "10 Safety Mechanisms" }
    ],
    images: [
      "/img/products/instant-pot-duo.jpg",
      "/img/products/instant-pot-duo-open.jpg"
    ],
    manufacturer: "Instant Brands",
    warranty: "1 Year Limited Warranty",
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-09-09"),
    isActive: true
  },

  {
    productId: 1013,
    name: "Philips Sonicare Diamond Care Toothbrush",
    description:
      "Electric toothbrush with diamond-shaped brush head, 62,000 strokes/min, smart timer, and pressure control",
    category: {
      mainCategory: "Health & Beauty",
      subCategory: "Oral Care",
      tags: ["electric-toothbrush", "rechargeable", "smart", "dental"]
    },
    price: {
      MRP: 12999,
      sellingPrice: 9999,
      discount: 23,
      currency: "INR"
    },
    stock: { quantity: 94, unit: "pieces", reorderLevel: 20 },
    rating: { average: 4.6, reviewCount: 2145 },
    specifications: [
      { spec: "Brush Head", value: "Diamond-Shaped" },
      { spec: "Vibration", value: "62,000 strokes/min" },
      { spec: "Runtime", value: "14 days" },
      { spec: "Charging Time", value: "24 hours" },
      { spec: "Features", value: "Smart Timer, Pressure Control" }
    ],
    images: [
      "/img/products/philips-sonicare.jpg",
      "/img/products/philips-sonicare-accessories.jpg"
    ],
    manufacturer: "Philips Healthcare",
    warranty: "2 Years Manufacturer Warranty",
    createdAt: new Date("2024-04-05"),
    updatedAt: new Date("2024-09-12"),
    isActive: true
  },

  {
    productId: 1014,
    name: "Fitbit Charge 6",
    description:
      "Fitness tracker with built-in GPS, heart rate monitor, 7-day battery life, and comprehensive health tracking features",
    category: {
      mainCategory: "Electronics",
      subCategory: "Wearables",
      tags: ["fitness-tracker", "GPS", "health-monitoring", "waterproof"]
    },
    price: {
      MRP: 19999,
      sellingPrice: 15999,
      discount: 20,
      currency: "INR"
    },
    stock: { quantity: 47, unit: "pieces", reorderLevel: 15 },
    rating: { average: 4.5, reviewCount: 876 },
    specifications: [
      { spec: "Display", value: "AMOLED 1.04 inch" },
      { spec: "GPS", value: "Built-in GPS" },
      { spec: "Battery", value: "7 days" },
      { spec: "Waterproof", value: "5 ATM" },
      { spec: "Sensors", value: "HR, EDA, Temperature" }
    ],
    images: [
      "/img/products/fitbit-charge-6.jpg",
      "/img/products/fitbit-charge-6-bands.jpg"
    ],
    manufacturer: "Fitbit Inc. (Google)",
    warranty: "1 Year Limited Warranty",
    createdAt: new Date("2024-06-15"),
    updatedAt: new Date("2024-09-10"),
    isActive: true
  },

  {
    productId: 1015,
    name: "GoPro Hero 12 Black",
    description:
      "Premium action camera with 5.3K video, 8x slow motion, waterproof to 33m, and advanced stabilization",
    category: {
      mainCategory: "Electronics",
      subCategory: "Cameras",
      tags: ["action-camera", "4K", "waterproof", "adventure"]
    },
    price: {
      MRP: 49999,
      sellingPrice: 42999,
      discount: 14,
      currency: "INR"
    },
    stock: { quantity: 18, unit: "pieces", reorderLevel: 6 },
    rating: { average: 4.8, reviewCount: 542 },
    specifications: [
      { spec: "Video", value: "5.3K 60fps, 4K 120fps" },
      { spec: "Sensor", value: "Full HD + 27MP Photo" },
      { spec: "Waterproof", value: "33m without housing" },
      { spec: "Stabilization", value: "HyperSmooth 6.0" },
      { spec: "Battery", value: "1720mAh (approx 1h)" }
    ],
    images: [
      "/img/products/gopro-hero-12.jpg",
      "/img/products/gopro-hero-12-mounts.jpg",
      "/img/products/gopro-hero-12-underwater.jpg"
    ],
    manufacturer: "GoPro Inc.",
    warranty: "1 Year Limited Warranty",
    createdAt: new Date("2024-07-20"),
    updatedAt: new Date("2024-09-11"),
    isActive: true
  },

  {
    productId: 1016,
    name: "Lenovo ThinkPad X1 Carbon",
    description:
      "Business ultrabook with Intel Core i7, 16GB RAM, 512GB SSD, 14-hour battery, and premium security features",
    category: {
      mainCategory: "Electronics",
      subCategory: "Laptops",
      tags: ["business", "ultrabook", "secure", "durable"]
    },
    price: {
      MRP: 139999,
      sellingPrice: 119999,
      discount: 14,
      currency: "INR"
    },
    stock: { quantity: 26, unit: "pieces", reorderLevel: 8 },
    rating: { average: 4.6, reviewCount: 423 },
    specifications: [
      { spec: "Processor", value: "Intel Core i7-1365U" },
      { spec: "RAM", value: "16GB LPDDR5" },
      { spec: "Storage", value: "512GB SSD" },
      { spec: "Display", value: "14-inch FHD IPS" },
      { spec: "Battery", value: "Up to 14 hours" }
    ],
    images: [
      "/img/products/thinkpad-x1-carbon.jpg",
      "/img/products/thinkpad-x1-carbon-open.jpg"
    ],
    manufacturer: "Lenovo Group",
    warranty: "1 Year Premium Plus Support",
    createdAt: new Date("2024-03-20"),
    updatedAt: new Date("2024-09-10"),
    isActive: true
  },

  {
    productId: 1017,
    name: "Logitech MX Master 3S Mouse",
    description:
      "Premium wireless mouse with advanced scrolling, customizable buttons, USB-C charging, and multi-device connectivity",
    category: {
      mainCategory: "Electronics",
      subCategory: "Peripherals",
      tags: ["wireless", "ergonomic", "multi-device", "premium"]
    },
    price: {
      MRP: 12999,
      sellingPrice: 10499,
      discount: 19,
      currency: "INR"
    },
    stock: { quantity: 68, unit: "pieces", reorderLevel: 15 },
    rating: { average: 4.7, reviewCount: 1876 },
    specifications: [
      { spec: "Connectivity", value: "2.4GHz Wireless + Bluetooth" },
      { spec: "Resolution", value: "8K DPI" },
      { spec: "Buttons", value: "8 Programmable Buttons" },
      { spec: "Battery", value: "70 days per charge" },
      { spec: "Weight", value: "112g" }
    ],
    images: [
      "/img/products/logitech-mx-master-3s.jpg",
      "/img/products/logitech-mx-master-3s-buttons.jpg"
    ],
    manufacturer: "Logitech International",
    warranty: "3 Years Limited Hardware Warranty",
    createdAt: new Date("2024-05-10"),
    updatedAt: new Date("2024-09-12"),
    isActive: true
  },

  {
    productId: 1018,
    name: "Microsoft Surface Pro 10",
    description:
      "2-in-1 laptop-tablet with Intel Core i7, 16GB RAM, 512GB SSD, beautiful 13-inch PixelSense touchscreen",
    category: {
      mainCategory: "Electronics",
      subCategory: "Tablets",
      tags: ["2-in-1", "touchscreen", "Windows", "portable"]
    },
    price: {
      MRP: 179999,
      sellingPrice: 159999,
      discount: 11,
      currency: "INR"
    },
    stock: { quantity: 17, unit: "pieces", reorderLevel: 5 },
    rating: { average: 4.6, reviewCount: 678 },
    specifications: [
      { spec: "Processor", value: "Intel Core i7-1365U" },
      { spec: "RAM", value: "16GB LPDDR5" },
      { spec: "Storage", value: "512GB SSD" },
      { spec: "Display", value: "13-inch PixelSense (2880x1920)" },
      { spec: "Weight", value: "879g" }
    ],
    images: [
      "/img/products/surface-pro-10.jpg",
      "/img/products/surface-pro-10-stand.jpg",
      "/img/products/surface-pro-10-kickstand.jpg"
    ],
    manufacturer: "Microsoft Corporation",
    warranty: "1 Year Limited Hardware Warranty",
    createdAt: new Date("2024-01-30"),
    updatedAt: new Date("2024-09-09"),
    isActive: true
  },

  {
    productId: 1019,
    name: "JBL Flip 6 Bluetooth Speaker",
    description:
      "Waterproof portable speaker with JBL Pro Sound, 12-hour battery, IP67 rated, and 360-degree sound",
    category: {
      mainCategory: "Electronics",
      subCategory: "Audio",
      tags: ["portable", "waterproof", "Bluetooth", "party"]
    },
    price: {
      MRP: 13999,
      sellingPrice: 9999,
      discount: 29,
      currency: "INR"
    },
    stock: { quantity: 156, unit: "pieces", reorderLevel: 30 },
    rating: { average: 4.5, reviewCount: 3456 },
    specifications: [
      { spec: "Waterproof", value: "IP67" },
      { spec: "Battery", value: "12 hours playback" },
      { spec: "Connectivity", value: "Bluetooth 5.3" },
      { spec: "Sound", value: "JBL Pro Sound, 20Hz-20kHz" },
      { spec: "Weight", value: "285g" }
    ],
    images: [
      "/img/products/jbl-flip-6.jpg",
      "/img/products/jbl-flip-6-colors.jpg",
      "/img/products/jbl-flip-6-details.jpg"
    ],
    manufacturer: "JBL (Harman International)",
    warranty: "1 Year Limited Warranty",
    createdAt: new Date("2024-04-15"),
    updatedAt: new Date("2024-09-11"),
    isActive: true
  },

  {
    productId: 1020,
    name: "Samsung Galaxy Watch 6 Classic",
    description:
      "Premium smartwatch with rotating bezel, AMOLED display, health tracking, GPS, and up to 3 days battery",
    category: {
      mainCategory: "Electronics",
      subCategory: "Wearables",
      tags: ["smartwatch", "fitness", "health-tracking", "premium"]
    },
    price: {
      MRP: 32999,
      sellingPrice: 24999,
      discount: 24,
      currency: "INR"
    },
    stock: { quantity: 42, unit: "pieces", reorderLevel: 12 },
    rating: { average: 4.7, reviewCount: 1234 },
    specifications: [
      { spec: "Display", value: "1.3-inch AMOLED (432x432)" },
      { spec: "Processor", value: "Exynos W930" },
      { spec: "RAM/Storage", value: "2GB / 16GB" },
      { spec: "Battery", value: "3 days typical usage" },
      { spec: "Sensors", value: "HR, ECG, SpO2, Temperature" }
    ],
    images: [
      "/img/products/galaxy-watch-6-classic.jpg",
      "/img/products/galaxy-watch-6-classic-bands.jpg",
      "/img/products/galaxy-watch-6-classic-face.jpg"
    ],
    manufacturer: "Samsung Electronics",
    warranty: "1 Year Limited Warranty",
    createdAt: new Date("2024-08-01"),
    updatedAt: new Date("2024-09-12"),
    isActive: true
  }
]);

// ===== STEP 4: Create Indexes for Performance =====
// Index for product ID searches
db.products.createIndex({ productId: 1 });

// Index for category-based filtering
db.products.createIndex({ "category.mainCategory": 1, "category.subCategory": 1 });

// Compound index for price range queries with sorting
db.products.createIndex({
  "price.sellingPrice": 1,
  rating: -1
});

// Index for stock availability searches
db.products.createIndex({ "stock.quantity": 1 });

// Index for active products (common filter)
db.products.createIndex({ isActive: 1 });

// Index for created date (sorting by newest)
db.products.createIndex({ createdAt: -1 });

// Text index for searching product names and descriptions
db.products.createIndex({
  name: "text",
  description: "text",
  "category.tags": "text",
  manufacturer: "text"
});

// ===== STEP 5: Verify Collection =====
print("✓ Product Catalogue Collection Created Successfully!");
print("✓ Total Products Inserted: " + db.products.countDocuments());
print("✓ Indexes Created: 8");
print("\n--- Sample Queries ---\n");

// Find all products
print("1. Count all products:");
print(db.products.countDocuments());

// Find products in a category
print("\n2. Find Laptops (Electronics > Laptops):");
db.products.find({ "category.mainCategory": "Electronics", "category.subCategory": "Laptops" }).pretty();

// Find products within price range
print("\n3. Find products under 50,000 INR (sorted by rating):");
db.products
  .find({ "price.sellingPrice": { $lt: 50000 } })
  .sort({ "rating.average": -1 })
  .limit(5)
  .pretty();

// Find highly-rated products
print("\n4. Top 5 rated products:");
db.products
  .find({ "rating.average": { $gte: 4.7 } })
  .sort({ "rating.average": -1 })
  .limit(5)
  .pretty();

// Text search
print("\n5. Search for 'wireless' products:");
db.products.find({ $text: { $search: "wireless" } }).pretty();

// Aggregation pipeline - Category-wise product count
print("\n6. Products count by main category:");
db.products.aggregate([
  {
    $group: {
      _id: "$category.mainCategory",
      count: { $sum: 1 }
    }
  },
  { $sort: { count: -1 } }
]).pretty();

print("\n✓ MongoDB Product Catalogue is ready for use!");
