const router = require('express').Router();
const { police_check } = require('../../middlewares');
const userController = require('./controller');

router.get('/users', police_check('manage', 'User'), userController.index);

module.exports = router;
