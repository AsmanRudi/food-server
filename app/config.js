const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const secretKey = process.env.SECRET_KEY;
if (!secretKey || Buffer.byteLength(secretKey, 'utf8') < 32) {
  throw new Error('SECRET_KEY must be configured with at least 32 characters');
}

module.exports = {
  dbHost: process.env.DB_HOST,
  dbPort: process.env.DB_PORT,
  dbUser: process.env.DB_USER,
  dbPass: process.env.DB_PASS,
  dbName: process.env.DB_NAME,
  secretKey,
  serviceName: process.env.SERVICE_NAME,
  bankTransfer: {
    bank: process.env.BANK_TRANSFER_BANK || '',
    accountName: process.env.BANK_TRANSFER_ACCOUNT_NAME || '',
    accountNumber: process.env.BANK_TRANSFER_ACCOUNT_NUMBER || ''
  },
  midtrans: {
    serverKey: process.env.MIDTRANS_SERVER_KEY || '',
    clientKey: process.env.MIDTRANS_CLIENT_KEY || '',
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true'
  },

  rootPath: path.resolve(__dirname, '..'),
};