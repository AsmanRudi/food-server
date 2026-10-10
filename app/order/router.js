const router = require('express').Router();
const { police_check } = require('../../middlewares');
const orderController = require('./controller');

router.post(
    '/orders',
    police_check('create', 'Order'),
    orderController.store
);


router.get(
    '/orders',
    police_check('view', 'Order'),
    orderController.index
);

router.get(
    '/admin/orders',
    police_check('view', 'Order'),
    orderController.adminIndex
);

router.patch(
    '/admin/orders/:id/status',
    police_check('update', 'Order'),
    orderController.updateAdminStatus
);

router.post(
    '/admin/orders/:id/mark-paid',
    police_check('update', 'Invoice'),
    orderController.markAdminPaymentPaid
);

module.exports = router;