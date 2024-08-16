import './config/passport';
import cluster from 'cluster';
import os from 'os';
import express, { NextFunction, Request, Response } from 'express';
import session from 'express-session';
import passport from 'passport';
import cors from 'cors';
import dotenv from 'dotenv';
import Redis from 'ioredis';
import connectRedis from 'connect-redis';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import { ensureAuthenticated } from './middleware/authMiddleware';
import http from 'http';  // Import http for Socket.IO
import { Server as SocketIOServer } from 'socket.io'; // Import Socket.IO server

dotenv.config();

const numCPUs = os.cpus().length;
const RedisStore = connectRedis(session);
const redis = new Redis();

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died`);
    console.log('Forking a new worker...');
    cluster.fork(); 
  });
} else {
  const app = express();

  app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }));

  app.use(helmet());
  app.use(cookieParser());
  app.use(express.json());

  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
  });

  app.use(limiter);

  app.use(
    session({
      name: "sssid",
      store: new RedisStore({
        client: redis,
        disableTouch: true
      }),
      secret: process.env.SESSION_SECRET as string,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        maxAge: 1000 * 60 * 60 * 24,
      },
    })
  );
  app.use(passport.initialize());
  app.use(passport.session());

  // Add CSRF protection middleware

  app.get('/', ensureAuthenticated, (req, res) => {
    console.log(req.user);
  });

  app.get('/fast', ensureAuthenticated, (req, res) => {
    res.send("Heloooo");
  });

  app.get("/slow", (req, res) => {
    crypto.pbkdf2('secret', 'salt', 5000000, 512, 'sha512', () => {
      res.send("Slow!");
    });
  });

  app.use('/auth', require('./routes/auth').default);
  app.use('/user', require('./routes/user').default);
  app.use('/reset-settings', require('./routes/reset-password').default);
  app.use('/auction', require('./routes/auction').default);
  app.use('/bid', require('./routes/bid').default);

  app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack); 
    res.status(500).send({message: 'Something went wrong!', error: err.stack});
  }); 
  
  const server = http.createServer(app);
  const io = new SocketIOServer(server);

  // Handle socket connections
  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Join a room based on auction ID
    socket.on('join_auction', (auctionId) => {
      const room = `auction-${auctionId}`;
      socket.join(room);
      console.log(`User ${socket.id} joined room ${room}`);
    });

    // Handle bids
    socket.on('new_bid', (data) => {
      const room = `auction-${data.auctionId}`;
      io.to(room).emit('bid_update', data);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  const PORT = process.env.PORT || 5000 || 3001;
  server.listen(PORT, () => console.log(`Worker ${process.pid} running on port ${PORT}`));
}
