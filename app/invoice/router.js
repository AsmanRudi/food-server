const router = require('express').Router();
const { police_check } = require('../../middlewares');
const invoiceController = require('./controller');


router.get(
	'/admin/invoices/pending-transfers',
	police_check('view', 'Invoice'),
	invoiceController.pendingTransfers
);

router.post(
	'/admin/invoices/:order_id/confirm-transfer',
	police_check('update', 'Invoice'),
	invoiceController.confirmTransfer
);

router.get ('/invoices/:order_id', invoiceController.show);
   

module.exports = router;