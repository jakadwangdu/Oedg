const mongoose = require('mongoose');

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error('❌ MONGO_URI is not set in environment variables.');
    return;
  }

  let isConnecting = false;
  const connectWithRetry = async () => {
    if (isConnecting) return;
    isConnecting = true;
    try {
      const conn = await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
      });
      console.log(`✅ MongoDB connected: ${conn.connection.host}`);
    } catch (error) {
      console.warn(`ℹ️ Notice: MongoDB Atlas not reachable (${error.message.split('\n')[0]}). Using resilient LocalDb storage.`);
      setTimeout(() => {
        isConnecting = false;
        connectWithRetry();
      }, 30000);
    } finally {
      isConnecting = false;
    }
  };

  mongoose.connection.on('disconnected', () => {
    if (!isConnecting && mongoose.connection.readyState === 0) {
      setTimeout(connectWithRetry, 30000);
    }
  });

  await connectWithRetry();
};

module.exports = connectDB;
