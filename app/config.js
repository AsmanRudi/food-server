const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

module.exports = {
  dbHost: process.env.DB_HOST,
  dbPort: process.env.DB_PORT,
  dbUser: process.env.DB_USER,
  dbPass: process.env.DB_PASS,
  dbName: process.env.DB_NAME,
  secretKey: process.env.SECRET_KEY,
  serviceName: process.env.SERVICE_NAME,

  rootPath: path.resolve(__dirname, '..'),
};