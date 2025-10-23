const User = require('../models/User');
const generateToken = require('../utils/generateToken');

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
