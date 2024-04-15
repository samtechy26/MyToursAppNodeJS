const express = require('express');
const userController = require('./../controllers/userController');
const authController = require('./../controllers/authController');

router = express.Router();

router.post('/signup', authController.signup);
router.post('/login', authController.login);
router.post('/forgotpassword', authController.forgotPassword);
router.patch('/resetpassword/:token', authController.resetPassword);

// protect all routes after this middleware
router.use(authController.protect);
router.patch('/updatepassword', authController.updatePassword);
router.get('/me', userController.getMe, userController.getUser);
router.patch('/updateme', userController.updateMe);
router.delete('/deleteme', userController.deleteMe);

// restrict all routes from here to just admin users
router.use(authController.restrictTo('admin', 'lead-guide'));
router.route('/').get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

module.exports = router;
