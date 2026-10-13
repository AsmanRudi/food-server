var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
const cors = require('cors');
const { decodeToken } = require('./middlewares');
const productRoute = require('./app/product/router');
const categoryRoute = require('./app/category/router');
const tagRoute = require('./app/tag/router');
const authRoute = require('./app/auth/router');
const deliveryAddressRoute = require('./app/DeliveryAddress/router');
const cartRoute = require('./app/cart/router');
const orderRoute = require('./app/order/router');
const invoiceRoute = require('./app/invoice/router');
const paymentRoute = require('./app/payment/router');
const fs = require('fs');

var app = express();

const db = require('./database');

app.use(async (req, res, next) => {
  try {
    await db.ready;
    next();
  } catch (err) {
    console.error('Database unavailable:', err.message);
    res.status(503).json({
      error: 1,
      message: 'Database temporarily unavailable',
    });
  }
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(cors());
app.use(decodeToken());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Rute API & Auth
app.use('/auth', authRoute);
app.use('/api', productRoute);
app.use('/api', categoryRoute);
app.use('/api', tagRoute);
app.use('/api', deliveryAddressRoute);
app.use('/api', cartRoute);
app.use('/api', orderRoute);
app.use('/api', invoiceRoute);
app.use('/api', paymentRoute);

// Serve React Frontend (Vite)
const frontendDist = path.join(__dirname, 'frontend', 'dist');
app.use(express.static(frontendDist));

app.get('*', (req, res, next) => {
  // Lewatkan endpoint API dan Auth yang tidak ditemukan ke error handler
  if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
    return next(createError(404, 'API endpoint not found'));
  }

  const indexPath = path.join(frontendDist, 'index.html');

  if (fs.existsSync(indexPath)) {
    return res.sendFile(indexPath, (err) => {
      if (err && !res.headersSent) {
        console.error('Error sending index.html:', err);
        res.status(500).send('Error loading page');
      }
    });
  }

  // Fallback jika frontend/dist/index.html belum ter-build
  console.error('Frontend build missing at path:', indexPath);
  res.status(404).json({
    success: false,
    message: 'Frontend build file (index.html) not found on server.',
    searchedPath: indexPath
  });
});

// Error Handler Terpusat
app.use(function (err, req, res, next) {
  console.error('Application error:', err.stack || err);

  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  const status = err.status || err.statusCode || 500;

  if (req.path.startsWith('/api') || req.path.startsWith('/auth')) {
    return res.status(status).json({
      error: 1,
      message:
        req.app.get('env') === 'development'
          ? err.message
          : 'Internal Server Error',
    });
  }

  return res.status(status).render('error', function (renderErr, html) {
    if (renderErr) {
      console.error('Error rendering error.pug:', renderErr.message);
      return res.status(500).send('Internal Server Error');
    }
    return res.send(html);
  });
});

module.exports = app;