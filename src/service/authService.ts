import bcrypt from 'bcryptjs';
import { sendVerificationCodeEmail } from '../config/nodmailer';
import prisma from '../config/db';

class AuthSerivice {
  // Kullanıcı kaydı ve doğrulama kodu gönderme
    async registerUser(email: string, password: string, firstName: string,lastName:string) {
      
      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

      // Doğrulama kodu süresini belirle (2 dakika)
      const verificationCodeExpiresAt = new Date(Date.now() + 2 * 60 * 1000);

      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          firstName,
          lastName,
          verificationCode,
          verificationCodeExpiresAt,
          isEmailVerified:false
        },
      });

      await sendVerificationCodeEmail(email, verificationCode);

      return user;
    }

    // Doğrulama kodunu kontrol et
    async verifyUser(email: string, verificationCode: string) {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        throw new Error('Kullanıcı bulunamadı');
      }

      if (
        user.verificationCode !== verificationCode ||
        !user.verificationCodeExpiresAt ||
        user.verificationCodeExpiresAt < new Date()
      ) {
        throw new Error('Doğrulama kodu hatalı veya süresi dolmuş');
      }

      await prisma.user.update({
        where: { email },
        data: { verificationCode: null, verificationCodeExpiresAt: null ,isEmailVerified:true},
      });

      return { message: 'Hesap doğrulandı' };
    }

  // Doğrulama kodunu yeniden gönder
  async resendVerificationCode(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('Kullanıcı bulunamadı');
    }

    const newVerificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const verificationCodeExpiresAt = new Date(Date.now() + 2 * 60 * 1000);

    await prisma.user.update({
      where: { email },
      data: {
        verificationCode: newVerificationCode,
        verificationCodeExpiresAt,
      },
    });

    await sendVerificationCodeEmail(email, newVerificationCode);

    return { message: 'Yeni doğrulama kodu gönderildi' };
  }


  
 
}

export default AuthSerivice;
