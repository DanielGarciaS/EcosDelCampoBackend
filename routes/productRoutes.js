const express = require('express');
const {
  getAllProducts,
  getProductById,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  toggleAvailability
} = require('../controllers/productController');
const { protect, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// Rutas públicas (no requieren autenticación)
router.get('/', getAllProducts);
router.get('/:id', getProductById);

// Rutas protegidas (requieren autenticación)
router.use(protect); // Todas las rutas de abajo requieren estar autenticado

// Obtener productos del agricultor autenticado
router.get('/agricultor/mis-productos', getMyProducts);

// Rutas solo para agricultores
router.post('/', authorize('agricultor'), createProduct);
router.put('/:id', authorize('agricultor'), updateProduct);
router.delete('/:id', authorize('agricultor'), deleteProduct);
router.patch('/:id/toggle-disponibilidad', authorize('agricultor'), toggleAvailability);

module.exports = router;
