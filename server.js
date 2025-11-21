if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const connectDB = require('./config/db');

// Importar rutas
const authRoutes = require('./routes/authRoutes');
const productRoutes = require('./routes/productRoutes');
const userRoutes = require('./routes/userRoutes');
const cartRoutes = require('./routes/cartRoutes');
const orderRoutes = require('./routes/orderRoutes');
const healthRoutes = require('./routes/healthRoutes');

const app = express();

// Conectar a MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: '*', // Permitir todos los orígenes
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rutas
app.get('/', (req, res) => {
  res.json({ 
    message: 'Bienvenido a Ecos del Campo API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      products: '/api/products',
      users: '/api/users',
      cart: '/api/cart',
      orders: '/api/orders'
    }
  });
});

// Montar rutas
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api', healthRoutes);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Puerto
const PORT = process.env.PORT || 5000;
app.listen(PORT, '0.0.0.0', () => {  // ← AGREGAR '0.0.0.0'
  console.log(`🚀 Servidor corriendo en puerto ${PORT}`);
  console.log(`📍 Modo: ${process.env.NODE_ENV}`);
  console.log(`🌐 Accesible desde: http://192.168.100.11:${PORT}`);
});

