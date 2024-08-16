import { NextFunction, Request, Response } from 'express';
import AuthSerivice from '../service/authService'; 
import passport from 'passport';

class AuthController {
  private authService: AuthSerivice;

  constructor() {
    this.authService = new AuthSerivice();
  }

  // Kayıt işlemi
  async register(req: Request, res: Response,next :NextFunction) {
    try {
      const { email, password, firstName ,lastName} = req.body;
      if (password.length < 8 || !/[A-Z]/.test(password) || !/\d/.test(password)) {
        return res.status(400).json({ message: 'Password must be at least 8 characters long, include an uppercase letter and a number' });
    }
      const user = await this.authService.registerUser(email, password, firstName,lastName);
      res.status(201).json(user);
    } catch (error) {
      next(error)
    }
  }

  // Doğrulama işlemi
  async verify(req: Request, res: Response,next :NextFunction) {
    try {
      const { email, verificationCode } = req.body;
      const result = await this.authService.verifyUser(email, verificationCode);
      res.status(200).json(result);
    } catch (error) {
      next(error)
    }
  }

  // Doğrulama kodunu yeniden gönder
  async resendVerificationCode(req: Request, res: Response,next :NextFunction) {
    try {
      const { email } = req.body;
      const result = await this.authService.resendVerificationCode(email);
      res.status(200).json(result);
    } catch (error) {
      next(error)
    }
  }

 async login(req: Request, res: Response, next: NextFunction) {
    passport.authenticate('local', async (err: Error, user: any, info: { message: string }) => {
      if (err) return next(err);
      if (!user) return res.status(401).json({ message: info.message });
  
      req.logIn(user, (err) => {
        if (err) return next(err);
        res.json({ message: 'Logged in successfully', user });
      });
    })(req, res, next);
  }





}

export default AuthController;
