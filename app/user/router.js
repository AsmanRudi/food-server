const router = require('express').Router();
const { police_check } = require('../../middlewares');
const userController = require('./controller');

router.get('/users', police_check('manage', 'User'), userController.index);
router.post('/users', police_check('manage', 'User'), userController.store);
router.patch('/users/:id/role', police_check('manage', 'User'), userController.updateRole);

module.exports = router;
