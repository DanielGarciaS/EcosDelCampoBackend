const express = require('express');
const {
  createOrder,
  getMyOrders,
  getOrderById,
  cancelOrder,
  getOrdersForAgricultor,
  updateOrderStatus,
  getAgricultorStats   // ← NUEVO
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(protect);

// Rutas para agricultores
// ESTADÍSTICAS del agricultor
router.get('/agricultor/stats', authorize('agricultor'), getAgricultorStats);

// PEDIDOS del agricultor
router.get('/agricultor', authorize('agricultor'), getOrdersForAgricultor);

router.put('/:id/estado', authorize('agricultor'), updateOrderStatus);  // ← NUEVO

// Rutas para compradores
router.post('/', authorize('comprador'), createOrder);
router.get('/mis-pedidos', authorize('comprador'), getMyOrders);
router.put('/:id/cancelar', authorize('comprador'), cancelOrder);

// Rutas compartidas
router.get('/:id', getOrderById);

module.exports = router;