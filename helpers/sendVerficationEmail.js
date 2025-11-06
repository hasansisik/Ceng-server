const sendEmail = require('./sendEmail');

const sendVerificationEmail = async ({
  name,
  email,
  verificationCode,
}) => {
  const message = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff;">
      <div style="background: linear-gradient(to right, #4CAF50, #45a049); padding: 20px; text-align: center;">
        <h1 style="color: #ffffff; font-weight: bold; margin: 0; font-size: 28px;">CENG</h1>
      </div>
      
      <div style="padding: 30px 20px;">
        <h2 style="color: #333; font-size: 24px; margin-bottom: 20px;">Merhaba, ${name}!</h2>
        <p style="color: #333; font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
          Hesabınızı oluşturduğunuz için teşekkürler! Hesabınızı aktifleştirmek için aşağıdaki doğrulama kodunu kullanın:
        </p>
        
        <div style="border: 2px dashed #4CAF50; padding: 25px; text-align: center; margin: 30px 0; background-color: #f9f9f9;">
          <p style="color: #666; font-size: 12px; text-transform: uppercase; margin: 0 0 10px 0; letter-spacing: 1px;">DOĞRULAMA KODU</p>
          <h1 style="color: #4CAF50; font-size: 36px; font-weight: bold; margin: 0; letter-spacing: 8px;">${verificationCode}</h1>
        </div>
        
        <div style="border-left: 4px solid #ff9800; background-color: #fff3cd; padding: 15px; margin: 20px 0;">
          <p style="color: #333; font-size: 14px; margin: 0; line-height: 1.6;">
            <strong>Önemli:</strong> Bu kod 10 dakika içinde geçersiz olacaktır. Eğer bu hesabı siz oluşturmadıysanız, bu e-postayı görmezden gelebilirsiniz.
          </p>
        </div>
      </div>
    </div>
  `;

  return sendEmail({
    to: email,
    subject: 'CENG - E-posta Doğrulama',
    html: message,
  });
};

module.exports = sendVerificationEmail;
