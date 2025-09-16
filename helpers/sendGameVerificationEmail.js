const nodemailer = require("nodemailer");

const sendGameVerificationEmail = async ({ username, email, verificationCode }) => {
  const transporter = nodemailer.createTransporter({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const mailOptions = {
    from: process.env.SMTP_FROM,
    to: email,
    subject: "Oyun Hesabı E-posta Doğrulama",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333; text-align: center;">Oyun Hesabınızı Doğrulayın</h2>
        <p>Merhaba <strong>${username}</strong>,</p>
        <p>Oyun hesabınızı oluşturduğunuz için teşekkürler! Hesabınızı aktifleştirmek için aşağıdaki doğrulama kodunu kullanın:</p>
        
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; margin: 20px 0;">
          <h1 style="color: #007bff; font-size: 32px; margin: 0; letter-spacing: 5px;">${verificationCode}</h1>
        </div>
        
        <p>Bu kodu oyun uygulamanızda veya web sitesinde girin. Kod 10 dakika geçerlidir.</p>
        
        <p>Eğer bu hesabı siz oluşturmadıysanız, bu e-postayı görmezden gelebilirsiniz.</p>
        
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px; text-align: center;">
          Bu e-posta otomatik olarak gönderilmiştir. Lütfen yanıtlamayın.
        </p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

module.exports = sendGameVerificationEmail;
