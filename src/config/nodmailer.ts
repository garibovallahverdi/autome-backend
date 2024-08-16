import nodemailer from 'nodemailer';

interface MailOptions {
  to: string;
  subject: string;
  text: string;
}

// Şifre sıfırlama e-postası gönderme
export const sendResetPasswordEmail = async (options: MailOptions): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.NODEMAILER_ADRESS,
      pass: process.env.NODEMAILER_PASS,
    },
  });

  const mailOptions = {
    from: process.env.NODEMAILER_ADRESS,
    to: options.to,
    subject: options.subject,
    text: options.text,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Şifre sıfırlama e-postası başarıyla gönderildi.');
  } catch (error) {
    console.error('Şifre sıfırlama e-postası gönderilirken hata oluştu:', error);
    throw new Error('Şifre sıfırlama e-postası gönderilemedi');
  }
};

// Doğrulama kodu e-postası gönderme
export const sendVerificationCodeEmail = async (to: string, verificationCode: string): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
      user: process.env.NODEMAILER_ADRESS,
      pass: process.env.NODEMAILER_PASS,
    },
  });

  const mailOptions = {
    from: process.env.NODEMAILER_ADRESS,
    to,
    subject: 'Hesap Doğrulama Kodu',
    text: `Doğrulama kodunuz: ${verificationCode}\nKod iki dakika geçerlidir.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Doğrulama kodu e-postası başarıyla gönderildi.');
  } catch (error) {
    console.error('Doğrulama kodu e-postası gönderilirken hata oluştu:', error);
    throw new Error('Doğrulama kodu e-postası gönderilemedi');
  }
};
