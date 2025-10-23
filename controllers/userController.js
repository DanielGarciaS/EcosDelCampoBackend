const User = require('../models/User');

// Actualizar perfil del usuario autenticado
exports.updateProfile = async (req, res) => {
  try {
    const fieldsToUpdate = {
      nombre: req.body.nombre,
      telefono: req.body.telefono,
      direccion: req.body.direccion,
      avatar: req.body.avatar
    };

    // Eliminar campos undefined
    Object.keys(fieldsToUpdate).forEach(key => 
      fieldsToUpdate[key] === undefined && delete fieldsToUpdate[key]
    );

    const user = await User.findByIdAndUpdate(
      req.user.id,
      fieldsToUpdate,
      {
        new: true,
        runValidators: true
      }
    );

    res.status(200).json({
      success: true,
      message: 'Perfil actualizado exitosamente',
      data: user
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: 'Error al actualizar perfil',
      error: error.message
    });
  }
};

// Cambiar contraseña
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Por favor proporciona la contraseña actual y la nueva'
      });
    }

    // Obtener usuario con password
    const user = await User.findById(req.user.id).select('+password');

    // Verificar contraseña actual
    const isMatch = await user.matchPassword(currentPassword);

    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Contraseña actual incorrecta'
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
    res.status(500).json({
      success: false,
      message: 'Error al cambiar contraseña',
      error: error.message
    });
  }
};

// Eliminar cuenta
exports.deleteAccount = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.user.id);

    res.status(200).json({
      success: true,
      message: 'Cuenta eliminada exitosamente'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al eliminar cuenta',
      error: error.message
    });
  }
};
