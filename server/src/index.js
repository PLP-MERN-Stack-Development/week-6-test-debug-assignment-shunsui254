const mongoose = require('mongoose');
const app = require('./app');
const logger = require('./utils/logger');

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/mern-testing';

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    logger.info(`MongoDB connected: ${mongoose.connection.host}`);
  } catch (error) {
    logger.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (error) => {
  logger.error('Unhandled Rejection:', error);
  process.exit(1);
});

// Start server
const startServer = async () => {
  await connectDB();
  
  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received');
    server.close(() => {
      logger.info('Process terminated');
      mongoose.connection.close();
    });
  });
};

if (require.main === module) {
  startServer();
}
