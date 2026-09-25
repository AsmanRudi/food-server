const { police_check } = require('../../middlewares');
const DeliveryAddress = require('./model');
const deliveryAddressController = require('./controller');
const router = require('express').Router();

router.post(
    '/delivery-addresses',
    police_check('create', 'DeliveryAddress'),
    deliveryAddressController.store
);

router.put(
    '/delivery-addresses/:id',
    police_check('update', 'DeliveryAddress', async (req) => {
        return DeliveryAddress.findById(req.params.id);
    }),
    deliveryAddressController.update
);

router.delete(
    '/delivery-addresses/:id',
    police_check('delete', 'DeliveryAddress', async (req) => {
        return DeliveryAddress.findById(req.params.id);
    }),
    deliveryAddressController.destroy
);

router.get(
    '/delivery-addresses',
    police_check('view', 'DeliveryAddress'),
    deliveryAddressController.index
);

module.exports = router;