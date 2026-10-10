const router = require('express').Router();
const controller = require('./controller');

router.get('/payment-options', controller.options);
router.post('/payment/midtrans/notification', controller.notification);

module.exports = router;