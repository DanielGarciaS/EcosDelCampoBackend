const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  nombre: {
    type: String,
    required: [true, 'El nombre del producto es requerido'],
    trim: true,
    maxlength: [100, 'El nombre no puede exceder 100 caracteres']
  },
  descripcion: {
    type: String,
    required: [true, 'La descripción es requerida'],
    trim: true,
    maxlength: [500, 'La descripción no puede exceder 500 caracteres']
  },
  precio: {
    type: Number,
    required: [true, 'El precio es requerido'],
    min: [0, 'El precio no puede ser negativo']
  },
  cantidad: {
    type: Number,
    required: [true, 'La cantidad es requerida'],
    min: [0, 'La cantidad no puede ser negativa'],
    default: 0
  },
  unidad: {
    type: String,
    enum: ['kg', 'piezas', 'litros', 'cajas', 'toneladas'],
    default: 'kg'
  },
  categoria: {
    type: String,
    required: [true, 'La categoría es requerida'],
    enum: ['frutas', 'verduras', 'granos', 'lacteos', 'carnes', 'otros'],
    default: 'otros'
  },
  imagen: {
    type: String,
    default: 'https://via.placeholder.com/400x300?text=Sin+Imagen'
  },
  disponible: {
    type: Boolean,
    default: true
  },
  agricultor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  ubicacion: {
    type: String,
    trim: true
  },
  fechaCosecha: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Actualizar updatedAt antes de guardar
productSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Product', productSchema);
