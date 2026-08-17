const mongoose = require('mongoose');

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    console.log('✅ Using existing MongoDB connection');
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      retryWrites: true,
    };

    const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://thakurprashant9720_db_user:CZ3SKvgHdyPyAkM5@cluster0.zlfum93.mongodb.net/?appName=Cluster0';

    cached.promise = mongoose.connect(MONGODB_URI, opts)
      .then((mongoose) => {
        console.log('✅ MongoDB Connected from config/db.js!');
        return mongoose;
      })
      .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err.message);
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
};

module.exports = connectDB;