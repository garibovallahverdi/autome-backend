import { Strategy as LocalStrategy } from 'passport-local';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import passport from 'passport';
import prisma from './db';
import bcrypt from 'bcryptjs';
import { PassportStatic } from 'passport';
import dotenv from 'dotenv';
dotenv.config();

  // Local Strategy
  passport.use(
    new LocalStrategy(
      {
        usernameField: 'email', // Define the field that contains the username
        passwordField: 'password', // Define the field that contains the password
      },
      async (email, password, done) => {
        try {
          const user = await prisma.user.findUnique({ where: { email ,isEmailVerified:true} });
          if (!user) return done(null, false, { message: 'Invalid credentials' });

          const isMatch = await bcrypt.compare(password, user.password);
          if (!isMatch) return done(null, false, { message: 'Invalid credentials' });

          return done(null, user); 
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Google Strategy
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_ID as string,
        clientSecret: process.env.GOOGLE_SECRET as string,
        callbackURL: `${process.env.BACK_URL}/auth/google/callback`
      },
      async (accessToken, refreshToken, profile: Profile, done) => {
        try {
          // Check if user already exists in our db
          let user = await prisma.user.findUnique({ where: { googleId: profile.id } });

          if (!user) {
            // If not, create a new user
            user = await prisma.user.create({  
              data: {
                googleId: profile.id,
                email: profile.emails?.[0].value ?? '',
                password: '', 
                firstName: profile.name?.givenName || "",  
                lastName:profile.name?.familyName || "",
                isEmailVerified:true
              },
            });
          }
          
          return done(null, user);  
        } catch (err) {
          console.log(err);
           
          return done(err);
        }
      }
    )
  );

  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id:string, done) => {
    try {
      const user = await prisma.user.findUnique({where:{id}})
      if (user) {
        done(null, user);
      } else {
      
        done(new Error('User not found'));
      } 
    } catch (error) {
      done(error);
    }
  })

  export default passport