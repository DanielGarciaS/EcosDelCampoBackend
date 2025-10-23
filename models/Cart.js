const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema({
  producto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  cantidad: {
    type: Number,
    required: true,
    min: [1, 'La cantidad mínima es 1'],
    default: 1
  },
  precio: {
    type: Number,
    required: true
  }
});

const cartSchema = new mongoose.Schema({
  usuario: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true // Un usuario solo puede tener un carrito
  },
  items: [cartItemSchema],
  total: {
    type: Number,
    default: 0
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Calcular el total antes de guardar
cartSchema.pre('save', function(next) {
  this.total = this.items.reduce((sum, item) => {
    return sum + (item.precio * item.cantidad);
  }, 0);
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Cart', cartSchema);
