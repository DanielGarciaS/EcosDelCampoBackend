const express = require('express');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getOrdersForAgricultor
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas para compradores
router.post('/', authorize('comprador'), createOrder);
router.get('/mis-pedidos', authorize('comprador'), getMyOrders);
router.get('/:id', getOrderById);
router.put('/:id/cancelar', authorize('comprador'), cancelOrder);

// Rutas para agricultores (ver pedidos de sus productos)
router.get('/agricultor/recibidos', authorize('agricultor'), getOrdersForAgricultor);

module.exports = router;
