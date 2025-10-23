const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Crear un nuevo pedido (checkout)
exports.createOrder = async (req, res) => {
  try {
    const { direccionEntrega, metodoPago, notas } = req.body;

    // Obtener el carrito del usuario
    const cart = await Cart.findOne({ usuario: req.user.id })
      .populate('items.producto');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El carrito está vacío'
      });
    }

    // Verificar disponibilidad y stock de todos los productos
    for (const item of cart.items) {
      const producto = await Product.findById(item.producto._id);

      if (!producto) {
        return res.status(404).json({
          success: false,
          message: `Producto ${item.producto.nombre} no encontrado`
        });
      }

      if (!producto.disponible) {
        return res.status(400).json({
          success: false,
          message: `El producto ${producto.nombre} ya no está disponible`
        });
      }

      if (producto.cantidad < item.cantidad) {
        return res.status(400).json({
          success: false,
          message: `Stock insuficiente para ${producto.nombre}. Solo hay ${producto.cantidad} unidades`
        });
      }
    }

    // Crear los items del pedido
    const orderItems = cart.items.map(item => ({
      producto: item.producto._id,
      nombre: item.producto.nombre,
      cantidad: item.cantidad,
      precio: item.precio,
      subtotal: item.precio * item.cantidad,
      agricultor: item.producto.agricultor
    }));

    // Calcular fecha estimada de entrega (3 días después)
    const fechaEntregaEstimada = new Date();
    fechaEntregaEstimada.setDate(fechaEntregaEstimada.getDate() + 3);

    // Crear el pedido
    const order = await Order.create({
      comprador: req.user.id,
      items: orderItems,
      total: cart.total,
      direccionEntrega,
      metodoPago,
      notas,
      fechaEntregaEstimada
    });

    // Actualizar el stock de los productos
    for (const item of cart.items) {
      await Product.findByIdAndUpdate(
        item.producto._id,
        { $inc: { cantidad: -item.cantidad } }
      );
    }

    // Vaciar el carrito
    cart.items = [];
    cart.total = 0;
    await cart.save();

    // Poblar el pedido antes de enviar
    const populatedOrder = await Order.findById(order._id)
      .populate('comprador', 'nombre email telefono')
      .populate('items.producto', 'nombre imagen')
      .populate('items.agricultor', 'nombre telefono email');

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: populatedOrder
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al crear el pedido',
      error: error.message
    });
  }
};

// Obtener todos los pedidos del comprador autenticado
exports.getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ comprador: req.user.id })
      .populate('items.producto', 'nombre imagen')
      .populate('items.agricultor', 'nombre telefono')
      .sort('-fechaPedido');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos',
      error: error.message
    });
  }
};

// Obtener un pedido por ID
exports.getOrderById = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('comprador', 'nombre email telefono direccion')
      .populate('items.producto', 'nombre imagen descripcion')
      .populate('items.agricultor', 'nombre telefono email');

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Verificar que el pedido pertenezca al usuario
    if (order.comprador._id.toString() !== req.user.id && req.user.rol !== 'agricultor') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para ver este pedido'
      });
    }

    res.status(200).json({
      success: true,
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedido',
      error: error.message
    });
  }
};

// Cancelar un pedido (solo si está pendiente)
exports.cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Verificar que el pedido pertenezca al usuario
    if (order.comprador.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para cancelar este pedido'
      });
    }

    // Solo se puede cancelar si está pendiente
    if (order.estado !== 'pendiente') {
      return res.status(400).json({
        success: false,
        message: `No se puede cancelar un pedido en estado: ${order.estado}`
      });
    }

    order.estado = 'cancelado';
    await order.save();

    // Devolver el stock a los productos
    for (const item of order.items) {
      await Product.findByIdAndUpdate(
        item.producto,
        { $inc: { cantidad: item.cantidad } }
      );
    }

    res.status(200).json({
      success: true,
      message: 'Pedido cancelado exitosamente',
      data: order
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al cancelar pedido',
      error: error.message
    });
  }
};

// BONUS: Obtener pedidos donde el usuario autenticado es el agricultor
exports.getOrdersForAgricultor = async (req, res) => {
  try {
    const orders = await Order.find({ 'items.agricultor': req.user.id })
      .populate('comprador', 'nombre email telefono')
      .populate('items.producto', 'nombre imagen')
      .sort('-fechaPedido');

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos',
      error: error.message
    });
  }
};
