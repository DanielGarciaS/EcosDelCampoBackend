const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Obtener el carrito del usuario autenticado
exports.getCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ usuario: req.user.id })
      .populate('items.producto', 'nombre precio imagen disponible');

    // Si no existe carrito, crear uno vacío
    if (!cart) {
      cart = await Cart.create({
        usuario: req.user.id,
        items: [],
        total: 0
      });
    }

    res.status(200).json({
      success: true,
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener el carrito',
      error: error.message
    });
  }
};

// Agregar producto al carrito
exports.addToCart = async (req, res) => {
  try {
    const { productoId, cantidad = 1 } = req.body;

    // Verificar que el producto existe y está disponible
    const producto = await Product.findById(productoId);
    
    if (!producto) {
      return res.status(404).json({
        success: false,
        message: 'Producto no encontrado'
      });
    }

    if (!producto.disponible) {
      return res.status(400).json({
        success: false,
        message: 'Este producto no está disponible'
      });
    }

    if (producto.cantidad < cantidad) {
      return res.status(400).json({
        success: false,
        message: `Solo hay ${producto.cantidad} unidades disponibles`
      });
    }

    // Obtener o crear carrito
    let cart = await Cart.findOne({ usuario: req.user.id });

    if (!cart) {
      cart = await Cart.create({
        usuario: req.user.id,
        items: []
      });
    }

    // Verificar si el producto ya está en el carrito
    const itemIndex = cart.items.findIndex(
      item => item.producto.toString() === productoId
    );

    if (itemIndex > -1) {
      // El producto ya existe, actualizar cantidad
      cart.items[itemIndex].cantidad += cantidad;
      
      // Verificar que no exceda el stock
      if (cart.items[itemIndex].cantidad > producto.cantidad) {
        return res.status(400).json({
          success: false,
          message: `Solo hay ${producto.cantidad} unidades disponibles`
        });
      }
    } else {
      // Agregar nuevo producto al carrito
      cart.items.push({
        producto: productoId,
        cantidad,
        precio: producto.precio
      });
    }

    await cart.save();

    // Poblar el carrito antes de enviar respuesta
    cart = await Cart.findById(cart._id)
      .populate('items.producto', 'nombre precio imagen disponible');

    res.status(200).json({
      success: true,
      message: 'Producto agregado al carrito',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al agregar producto al carrito',
      error: error.message
    });
  }
};

// Actualizar cantidad de un item en el carrito
exports.updateCartItem = async (req, res) => {
  try {
    const { itemId, cantidad } = req.body;

    if (!cantidad || cantidad < 1) {
      return res.status(400).json({
        success: false,
        message: 'La cantidad debe ser al menos 1'
      });
    }

    let cart = await Cart.findOne({ usuario: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carrito no encontrado'
      });
    }

    const item = cart.items.id(itemId);

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item no encontrado en el carrito'
      });
    }

    // Verificar stock disponible
    const producto = await Product.findById(item.producto);
    
    if (cantidad > producto.cantidad) {
      return res.status(400).json({
        success: false,
        message: `Solo hay ${producto.cantidad} unidades disponibles`
      });
    }

    item.cantidad = cantidad;
    await cart.save();

    cart = await Cart.findById(cart._id)
      .populate('items.producto', 'nombre precio imagen disponible');

    res.status(200).json({
      success: true,
      message: 'Cantidad actualizada',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al actualizar item',
      error: error.message
    });
  }
};

// Eliminar un item del carrito
exports.removeFromCart = async (req, res) => {
  try {
    const { itemId } = req.params;

    let cart = await Cart.findOne({ usuario: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carrito no encontrado'
      });
    }

    // Filtrar el item a eliminar
    cart.items = cart.items.filter(
      item => item._id.toString() !== itemId
    );

    await cart.save();

    cart = await Cart.findById(cart._id)
      .populate('items.producto', 'nombre precio imagen disponible');

    res.status(200).json({
      success: true,
      message: 'Producto eliminado del carrito',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar producto',
      error: error.message
    });
  }
};

// Vaciar el carrito
exports.clearCart = async (req, res) => {
  try {
    let cart = await Cart.findOne({ usuario: req.user.id });

    if (!cart) {
      return res.status(404).json({
        success: false,
        message: 'Carrito no encontrado'
      });
    }

    cart.items = [];
    cart.total = 0;
    await cart.save();

    res.status(200).json({
      success: true,
      message: 'Carrito vaciado',
      data: cart
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al vaciar carrito',
      error: error.message
    });
  }
};
