const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const crypto = require('crypto');
const { sendResetPasswordEmail } = require('../config/emailConfig'); // ← AGREGAR ESTA LÍNEA

// Registro de usuario
exports.register = async (req, res) => {
  try {
    const { nombre, email, password, rol, telefono, direccion } = req.body;

    // Verificar si el usuario ya existe
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'El usuario ya existe'
      });
    }

    // Crear usuario
    const user = await User.create({
      nombre,
      email,
      password,
      rol,
      telefono,
      direccion
    });

    // Generar token
    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: 'Usuario registrado exitosamente',
      data: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al registrar usuario',
      error: error.message
    });
  }
};

// Login de usuario
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validar email y password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporciona email y contraseña'
      });
    }

    // Buscar usuario y incluir password
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Verificar contraseña
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas'
      });
    }

    // Generar token
    const token = generateToken(user._id);
    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol,
        token
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al iniciar sesión',
      error: error.message
    });
  }
};

// Obtener perfil del usuario autenticado
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    res.status(200).json({
      success: true,
      data: user
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al obtener perfil',
      error: error.message
    });
  }
};

// 🆕 NUEVA FUNCIÓN - Actualizar perfil del usuario
exports.updateProfile = async (req, res) => {
  try {
    const { nombre, email, telefono, ubicacion } = req.body;
    const userId = req.user.id;

    // Validar que exista el usuario
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Validar email único (si cambió)
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'El email ya está registrado'
        });
      }
    }

    // Actualizar campos
    if (nombre) user.nombre = nombre;
    if (email) user.email = email;
    if (telefono) user.telefono = telefono;
    if (ubicacion) user.ubicacion = ubicacion;

    // Guardar cambios
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: {
        id: user._id,
        nombre: user.nombre,
        email: user.email,
        telefono: user.telefono,
        ubicacion: user.ubicacion,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('❌ Error en updateProfile:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: error.message
    });
  }
};

// 🆕 NUEVA FUNCIÓN - Cambiar contraseña
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validar que vienen los datos
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Contraseña actual y nueva son requeridas'
      });
    }

    // Buscar usuario CON el campo password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    // Verificar que la contraseña actual sea correcta
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
      });
    }

    // Validar que la nueva contraseña sea diferente
    if (currentPassword === newPassword) {
      return res.status(400).json({
        success: false,
        message: 'La nueva contraseña debe ser diferente'
      });
    }

    // Actualizar contraseña
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    console.error('❌ Error en changePassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña',
      error: error.message
    });
  }
};


// Solicitar recuperación de contraseña
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    console.log('📧 Solicitud de recuperación para:', email);

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No existe usuario con ese email'
      });
    }

    // Generar token de 6 dígitos
    const resetToken = Math.floor(100000 + Math.random() * 900000).toString();
    console.log('🔐 Token generado:', resetToken);

    // Guardar token con hash
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hora

    await user.save({ validateBeforeSave: false });
    console.log('💾 Token guardado en BD');

    // Enviar email
    console.log('📤 Enviando email a:', email);
    const emailSent = await sendResetPasswordEmail(email, resetToken, user.nombre);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: 'Error al enviar el email'
      });
    }

    console.log('✅ Email enviado exitosamente');

    res.status(200).json({
      success: true,
      message: 'Email de recuperación enviado exitosamente'
    });
  } catch (error) {
    console.error('❌ Error en forgotPassword:', error);
    res.status(500).json({
      success: false,
      message: 'Error al solicitar recuperación',
      error: error.message
    });
  }
};

// Resetear contraseña
exports.resetPassword = async (req, res) => {
  try {
    const { resetToken, newPassword } = req.body;

    if (!resetToken || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Token y contraseña son requeridos'
      });
    }

    // Hash del token recibido
    const resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Buscar usuario con el token válido y no expirado
    const user = await User.findOne({
      resetPasswordToken: resetPasswordToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Token inválido o expirado'
      });
    }

    // Actualizar contraseña
    user.password = newPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al resetear contraseña',
      error: error.message
    });
  }
};
