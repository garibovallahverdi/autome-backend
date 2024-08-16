// src/routes/auth.ts
import express, { Request, Response } from 'express';
import passport from 'passport';
import { ensureAuthenticated } from '../middleware/authMiddleware';
import AuthController from '../controller/auth';
const router = express.Router();

const authController = new AuthController()

// User registration
router.post('/register', (req, res, next) => authController.register(req, res,next));
router.post('/verify', (req, res, next) => authController.verify(req, res,next));
router.post('/resend-verification-code', (req, res,next) => authController.resendVerificationCode(req, res,next));
router.post('/login', (req, res, next) => authController.login(req, res, next));

// Google authentication route
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

// Google callback route
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/' }),
  (req, res) => {
    res.redirect('http://localhost:5173/');
    // res.status(200).json("Done")
  }
)

// User login

router.get('/check-session', async (req: Request, res: Response) => {
  
  if (req.isAuthenticated()) {
    res.json({ isAuthenticated: true, user: req.user });
  } else {
    // If session is expired or invalid, clear any session-related cookies
    res.clearCookie('remember_me');
    res.clearCookie('sssid'); // Assuming 'sssid' is the session cookie name
    res.json({ isAuthenticated: false });
  }
});
// User logout
router.get('/logout', (req: Request, res: Response) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ message: 'Error logging out', err });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current user info
router.get('/me', ensureAuthenticated, (req: Request, res: Response) => {
  res.json(req.user);
});

export default router;
