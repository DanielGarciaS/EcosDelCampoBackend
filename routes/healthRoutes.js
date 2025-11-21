const express = require('express');
const router = express.Router();

// Ruta simple para verificar que el servidor está activo
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

module.exports = router;
