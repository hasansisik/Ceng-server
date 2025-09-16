const nodemailer = require("nodemailer");

const sendGameResetPasswordEmail = async ({ username, email, passwordToken }) => {
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${passwordToken}&email=${email}`;

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Oyun Hesabı Şifre Sıfırlama",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Şifre Sıfırlama</h2>
        <p>Merhaba <strong>${username}</strong>,</p>
        <p>Oyun hesabınız için şifre sıfırlama talebinde bulundunuz. Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
            Şifremi Sıfırla
          </a>
        </div>
        
        <p>Alternatif olarak, aşağıdaki doğrulama kodunu kullanabilirsiniz:</p>
        
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${passwordToken}</h1>
        </div>
        
        <p><strong>Önemli:</strong> Bu bağlantı 10 dakika geçerlidir. Güvenliğiniz için bu süre sonunda geçersiz hale gelecektir.</p>
        
        <p>Eğer bu talebi siz yapmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendGameResetPasswordEmail;
