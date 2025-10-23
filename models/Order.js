const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  nombre: String,
  cantidad: {
    type: Number,
    required: true,
    min: 1
  },
  precio: {
    type: Number,
    required: true
  },
  subtotal: {
    type: Number,
    required: true
  },
  agricultor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
});

const orderSchema = new mongoose.Schema({
  comprador: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  items: [orderItemSchema],
  total: {
    type: Number,
    required: true
  },
  estado: {
    type: String,
    enum: ['pendiente', 'confirmado', 'en_proceso', 'enviado', 'entregado', 'cancelado'],
    default: 'pendiente'
  },
  direccionEntrega: {
    calle: String,
    ciudad: String,
    estado: String,
    codigoPostal: String,
    telefono: String
  },
  metodoPago: {
    type: String,
    enum: ['efectivo', 'tarjeta', 'transferencia'],
    default: 'efectivo'
  },
  notas: {
    type: String,
    maxlength: 500
  },
  fechaPedido: {
    type: Date,
    default: Date.now
  },
  fechaEntregaEstimada: {
    type: Date
  }
});

module.exports = mongoose.model('Order', orderSchema);
