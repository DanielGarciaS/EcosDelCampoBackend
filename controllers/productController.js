const Product = require('../models/Product');
const User = require('../models/User');

// Obtener todos los productos (público - para compradores también)
exports.getAllProducts = async (req, res) => {
  try {
    // Filtros opcionales
    const { categoria, search, disponible = true } = req.query;
    
    let query = { disponible };

    // Filtrar por categoría
    if (categoria) {
      query.categoria = categoria;
    }

    // Búsqueda por nombre o descripción
    if (search) {
      query.$or = [
        { nombre: { $regex: search, $options: 'i' } },
        { descripcion: { $regex: search, $options: 'i' } }
      ];
    }

    const products = await Product.find(query)
      .populate('agricultor', 'nombre email telefono ubicacion')
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener productos',
      error: error.message
    });
  }
};

// Obtener un producto por ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('agricultor', 'nombre email telefono ubicacion');

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener producto',
      error: error.message
    });
  }
};

// Obtener productos del agricultor autenticado
exports.getMyProducts = async (req, res) => {
  try {
    const products = await Product.find({ agricultor: req.user.id })
      .sort('-createdAt');

    res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener tus productos',
      error: error.message
    });
  }
};

// Crear un nuevo producto (solo agricultores)
exports.createProduct = async (req, res) => {
  try {
    // Agregar el ID del agricultor al producto
    req.body.agricultor = req.user.id;

    const product = await Product.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Producto creado exitosamente',
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al crear producto',
      error: error.message
    });
  }
};

// Actualizar un producto (solo el dueño)
exports.updateProduct = async (req, res) => {
  try {
    let product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar que el usuario sea el dueño del producto
    if (product.agricultor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para actualizar este producto'
      });
    }

    product = await Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Producto actualizado exitosamente',
      data: product
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al actualizar producto',
      error: error.message
    });
  }
};

// Eliminar un producto (solo el dueño)
exports.deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar que el usuario sea el dueño del producto
    if (product.agricultor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para eliminar este producto'
      });
    }

    await product.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Producto eliminado exitosamente',
      data: {}
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error.message
    });
  }
};

// Actualizar disponibilidad de un producto
exports.toggleAvailability = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    // Verificar que el usuario sea el dueño
    if (product.agricultor.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar este producto'
      });
    }

    product.disponible = !product.disponible;
    await product.save();

    res.status(200).json({
      success: true,
      message: `Producto ${product.disponible ? 'activado' : 'desactivado'}`,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cambiar disponibilidad',
      error: error.message
    });
  }
};
