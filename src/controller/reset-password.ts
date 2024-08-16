import { NextFunction, Request, Response } from 'express';
import prisma from '../config/db';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { sendResetPasswordEmail } from '../config/nodmailer';

// Şifre sıfırlama isteği
export const resetPasswordRequest = async (req: Request, res: Response, next: NextFunction) => {
    const { email } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // 6 haneli güvenli kod oluşturma
        const resetPasswordCode = crypto.randomInt(100000, 999999).toString();
        const resetPassCodeExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 dakika geçerlilik süresi

        // Kodun hash'lenerek saklanması
        const hashedCode = await bcrypt.hash(resetPasswordCode, 10);

        await prisma.user.update({
            where: { email },
            data: {
                resetPassswordCode: hashedCode,
                resetPassCodeExpiresAt,
            },
        });

        await sendResetPasswordEmail({
            to: user.email,
            subject: "Reset Password",
            text: `Şifrenizi sıfırlamak için bu kodu kullanın: ${resetPasswordCode}. Bu kod 10 dakika boyunca geçerlidir.`
        });

        res.status(200).json({ message: 'Successfully sent reset password code' });
    } catch (error) {
        next(error);
    }
}

// Şifre sıfırlama kodu kontrolü
export const verifyResetCode = async (req: Request, res: Response, next: NextFunction) => {
    const { email, resetCode } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (!user.resetPassswordCode) {
            return res.status(400).json({ message: 'Invalid reset code' });
        }
        // Süresi dolmuş mu kontrolü
        if (!user.resetPassCodeExpiresAt || user.resetPassCodeExpiresAt < new Date()) {
            return res.status(400).json({ message: 'Reset code has expired' });
        }

        // Kodun doğrulanması
        const isCodeValid = await bcrypt.compare(resetCode, user.resetPassswordCode);
        if (!isCodeValid) {
            return res.status(400).json({ message: 'Invalid reset code' });
        }

        res.status(200).json({ message: 'Reset code verified successfully' });
    } catch (error) {
        next(error);
    }
}

// Şifre sıfırlama
export const resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email, newPassword } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user || !user.resetPassCodeExpiresAt || !user.resetPassswordCode) {
            return res.status(404).json({ message: 'User not found' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        await prisma.user.update({
            where: { email },
            data: {
                password: hashedPassword,
                resetPassswordCode: null, // Kodun temizlenmesi
                resetPassCodeExpiresAt: null,
            },
        });

        res.status(200).json({ message: 'Password reset successful' });
    } catch (error) {
        next(error);
    }
}
