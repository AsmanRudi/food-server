const router = require('express').Router();
const { police_check } = require('../../middlewares');
const CategoryController = require('./controller');

router.get('/categories', CategoryController.index);
router.post('/categories',
    police_check('create', 'Category'),
    CategoryController.store);
router.put('/categories/:id',
    police_check('update', 'Category'),
    CategoryController.update);
router.delete('/categories/:id',
    police_check('delete', 'Category'),
    CategoryController.destroy);

module.exports = router;