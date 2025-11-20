const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASSWORD,
  },
});

const sendResetPasswordEmail = async (email, resetToken, nombre) => {
  try {
    const mailOptions = {
      from: `"Ecos del Campo" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: '🔐 Recupera tu contraseña - Ecos del Campo',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #2ecc71; padding: 20px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0;">🌾 Ecos del Campo</h1>
          </div>
          
          <div style="background-color: #f9f9f9; padding: 30px; text-align: center;">
            <h2 style="color: #333;">Hola ${nombre},</h2>
            <p style="color: #666; font-size: 16px; line-height: 1.6;">
              Recibimos una solicitud para recuperar tu contraseña. 
              Usa el siguiente código para continuar:
            </p>
            
            <div style="background-color: #2ecc71; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: white; font-size: 32px; letter-spacing: 5px; margin: 0;">
                ${resetToken}
              </h3>
            </div>
            
            <p style="color: #999; font-size: 14px;">
              ⏰ Este código expira en <strong>1 hora</strong>
            </p>
            
            <p style="color: #666; font-size: 14px; margin-top: 20px;">
              Si no solicitaste recuperar tu contraseña, ignora este correo.
            </p>
          </div>
          
          <div style="background-color: #333; color: white; padding: 15px; text-align: center; border-radius: 0 0 10px 10px;">
            <p style="margin: 0; font-size: 12px;">
              © 2025 Ecos del Campo. Todos los derechos reservados.
            </p>
          </div>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`✅ Email enviado a ${email}`);
    return true;
  } catch (error) {
    console.error('❌ Error enviando email:', error);
    return false;
  }
};

module.exports = { sendResetPasswordEmail };
