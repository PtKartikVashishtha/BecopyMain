const mongoose = require("mongoose");
const Job = require("../models/jobModel");
require("dotenv").config();

const MONGO_URI = process.env.DATABASE_URL || "mongodb://localhost:27017/yourdb";

async function migrate() {
  await mongoose.connect(MONGO_URI);

  await Job.updateMany(
    {},
    {
      $set: {
        locationSource: "manual",
        locationAccuracy: 100,
        applicationCount: 0,
        views: 0,
      },
    }
  );

  await Job.collection.createIndex({ latitude: 1, longitude: 1 });
  await Job.collection.createIndex({ country: 1, region: 1, city: 1 });
  await Job.collection.createIndex({ locationSource: 1 });

  console.log("Migration completed ✅");
  await mongoose.disconnect();
}

migrate().catch(console.error);
