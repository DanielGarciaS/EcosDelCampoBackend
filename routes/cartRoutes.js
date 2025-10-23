const express = require('express');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
} = require('../controllers/cartController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas requieren autenticación y rol de comprador
router.use(protect);
router.use(authorize('comprador'));

router.get('/', getCart);
router.post('/add', addToCart);
router.put('/update', updateCartItem);
router.delete('/remove/:itemId', removeFromCart);
router.delete('/clear', clearCart);

module.exports = router;
