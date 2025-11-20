const Order = require('../models/Order');
const Cart = require('../models/Cart');
const Product = require('../models/Product');

// Crear un nuevo pedido (checkout)
exports.createOrder = async (req, res) => {
  try {
    const { direccionEntrega, metodoPago, notas } = req.body;

    console.log('=== INICIANDO CREACIÓN DE PEDIDO ===');
    console.log('Comprador ID:', req.user.id);

    // Obtener el carrito del usuario CON populate del producto
    const cart = await Cart.findOne({ usuario: req.user.id })
      .populate('items.producto');

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'El carrito está vacío'
      });
    }

    console.log('Carrito encontrado con', cart.items.length, 'items');

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

    // Crear los items del pedido (ASEGURANDO QUE INCLUYAN EL AGRICULTOR)
    const orderItems = [];
    for (const item of cart.items) {
      // Obtener el producto completo para asegurar que tenemos el agricultor
      const productoCompleto = await Product.findById(item.producto._id);
      
      orderItems.push({
        producto: productoCompleto._id,
        nombre: productoCompleto.nombre,
        cantidad: item.cantidad,
        precio: item.precio,
        subtotal: item.precio * item.cantidad,
        agricultor: productoCompleto.agricultor  // ← AQUÍ ESTÁ LA CLAVE
      });

      console.log('Item agregado:', {
        producto: productoCompleto.nombre,
        agricultor: productoCompleto.agricultor
      });
    }

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

    console.log('Pedido creado con ID:', order._id);
    console.log('Items del pedido:', order.items.map(i => ({ 
      nombre: i.nombre, 
      agricultor: i.agricultor 
    })));

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

    console.log('=== PEDIDO CREADO EXITOSAMENTE ===');

    res.status(201).json({
      success: true,
      message: 'Pedido creado exitosamente',
      data: populatedOrder
    });
  } catch (error) {
    console.error('❌ Error creando pedido:', error);
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
    console.error('Error en getMyOrders:', error);
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
    console.error('Error en getOrderById:', error);
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
    console.error('Error en cancelOrder:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cancelar pedido',
      error: error.message
    });
  }
};

// Obtener pedidos donde el usuario autenticado es el agricultor
exports.getOrdersForAgricultor = async (req, res) => {
  try {
    console.log('=== GET ORDERS FOR AGRICULTOR ===');
    console.log('Agricultor ID:', req.user.id);
    
    // Buscar pedidos que contengan productos del agricultor
    const orders = await Order.find({ 'items.agricultor': req.user.id })
      .populate('comprador', 'nombre email telefono')
      .populate('items.producto', 'nombre imagen')
      .populate('items.agricultor', 'nombre telefono email')
      .sort('-fechaPedido');

    console.log('Pedidos encontrados:', orders.length);
    
    if (orders.length > 0) {
      console.log('Primer pedido (ejemplo):', {
        id: orders[0]._id,
        comprador: orders[0].comprador?.nombre,
        items: orders[0].items.map(i => ({
          nombre: i.nombre,
          agricultor: i.agricultor?._id
        }))
      });
    }

    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (error) {
    console.error('❌ Error en getOrdersForAgricultor:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener pedidos',
      error: error.message
    });
  }
};
// Cambiar el estado de un pedido (solo agricultores)
exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    // Validar estado
    const estadosValidos = ['pendiente', 'confirmado', 'en_proceso', 'enviado', 'entregado', 'cancelado'];
    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado no válido'
      });
    }

    const order = await Order.findById(id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Pedido no encontrado'
      });
    }

    // Verificar que el agricultor tenga productos en este pedido
    const tieneProductos = order.items.some(
      item => item.agricultor.toString() === req.user.id
    );

    if (!tieneProductos) {
      return res.status(403).json({
        success: false,
        message: 'No tienes permiso para modificar este pedido'
      });
    }

    order.estado = estado;
    await order.save();

    const updatedOrder = await Order.findById(id)
      .populate('comprador', 'nombre email telefono')
      .populate('items.producto', 'nombre imagen')
      .populate('items.agricultor', 'nombre telefono email');

    res.status(200).json({
      success: true,
      message: 'Estado actualizado exitosamente',
      data: updatedOrder
    });
  } catch (error) {
    console.error('Error en updateOrderStatus:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado',
      error: error.message
    });
  }
};
// ← AGREGAR ESTA FUNCIÓN AL FINAL

// Obtener estadísticas del agricultor
// ==========================================
// ESTADÍSTICAS DEL AGRICULTOR
// ==========================================
exports.getAgricultorStats = async (req, res) => {
  try {
    console.log('📊 Obteniendo estadísticas para agricultor:', req.user.id);
    
    // Obtener todas las órdenes donde el agricultor tiene productos
    const orders = await Order.find({ 'items.agricultor': req.user.id })
      .populate('items.agricultor')
      .populate('items.producto');
    
    // Obtener todos los productos del agricultor
    const products = await Product.find({ agricultor: req.user.id });
    
    // Calcular estadísticas
    const totalVentas = orders.reduce((sum, order) => {
      const itemsDelAgricultor = order.items.filter(
        item => item.agricultor._id.toString() === req.user.id
      );
      return sum + itemsDelAgricultor.reduce((itemSum, item) => itemSum + item.subtotal, 0);
    }, 0);
    
    const ordenesPendientes = orders.filter(
      order => order.estado === 'pendiente' && 
                order.items.some(item => item.agricultor._id.toString() === req.user.id)
    ).length;
    
    const stats = {
      totalVentas: parseFloat(totalVentas.toFixed(2)),
      totalProductos: products.length,
      ordenesPendientes: ordenesPendientes,
      totalOrdenes: orders.length
    };
    
    console.log('✅ Estadísticas calculadas:', stats);
    
    res.status(200).json({
      success: true,
      data: stats
    });
    
  } catch (error) {
    console.error('❌ Error en getAgricultorStats:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas',
      error: error.message
    });
  }
};
