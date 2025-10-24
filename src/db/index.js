import mongoose from "mongoose";

mongoose.set("strictQuery", false); // suppress deprecation warning

const connectToMongo = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI); // no need for extra options
    console.log(
      `✅ Connected to mongo !! HOST: ${conn.connection.host} DB: ${conn.connection.name}`
    );
  } catch (error) {
    console.error("❌ MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

export default connectToMongo;
