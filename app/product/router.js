const router = require('express').Router();
const multer = require('multer');
const os = require('os');

const productController = require('./controller');
const { police_check } = require('../../middlewares');
const uploadImage = multer({
    dest: os.tmpdir(),
    limits: { fileSize: 4 * 1024 * 1024 }
});

router.get('/products',productController.index);

router.post('/products',
    uploadImage.single('image'),
    police_check('create', 'Product'),
    productController.store);

router.put('/products/:id',
    uploadImage.single('image'),
    police_check('update', 'Product'),
    productController.update);

router.delete('/products/:id',
    police_check('delete', 'Product'),
    productController.destroy);



module.exports = router;