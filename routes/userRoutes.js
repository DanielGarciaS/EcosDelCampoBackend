const express = require('express');
const {
  updateProfile,
  changePassword,
  deleteAccount
} = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

router.put('/profile', updateProfile);
router.put('/change-password', changePassword);
router.delete('/delete-account', deleteAccount);

module.exports = router;
