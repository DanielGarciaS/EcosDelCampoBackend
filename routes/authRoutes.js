const express = require('express');
const { 
  register, 
  login, 
  getProfile, 
  updateProfile,           // 🆕 AGREGAR
  changePassword,  
  forgotPassword, 
  resetPassword 
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/profile', protect, getProfile);
router.post('/profile', protect, updateProfile);           // 🆕 NUEVA - Actualizar perfil
router.post('/profile/change-password', protect, changePassword); // 🆕 NUEVA - Cambiar contraseña

// ← OTRAS RUTAS
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


module.exports = router;
