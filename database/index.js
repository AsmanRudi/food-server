
const mongoose = require('mongoose');
const config = require('../app/config');

const mongoUri = process.env.MONGODB_URI;

const connectionString = mongoUri ||
  `mongodb://${encodeURIComponent(config.dbUser || '')}:${encodeURIComponent(config.dbPass || '')}@${config.dbHost}:${config.dbPort}/${config.dbName}?authSource=admin`;

const db = mongoose.connection;

db.on('connected', () => {
  console.log('MongoDB connected');
});

db.on('error', (err) => {
  console.error('MongoDB connection error:', err.message);
});

db.on('disconnected', () => {
  console.warn('MongoDB disconnected');
});

db.ready = mongoose.connect(connectionString, {
  serverSelectionTimeoutMS: 10000,
});

module.exports = db;
