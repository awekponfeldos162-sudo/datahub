const passport = require('passport');
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { Strategy: LocalStrategy } = require('passport-local');
const { Strategy: GoogleStrategy } = require('passport-google-oauth20');
const bcrypt = require('bcrypt');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// JWT Strategy
passport.use(new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
    algorithms: ['RS256', 'HS256'],
  },
  async (payload, done) => {
    try {
      const user = await prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, fullName: true, plan: true, emailVerified: true },
      });
      if (!user) return done(null, false);
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  }
));

// Local Strategy (email + password)
passport.use(new LocalStrategy(
  { usernameField: 'email', passwordField: 'password' },
  async (email, password, done) => {
    try {
      const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
      if (!user || !user.passwordHash) {
        return done(null, false, { message: 'Email ou mot de passe incorrect' });
      }
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return done(null, false, { message: 'Email ou mot de passe incorrect' });
      }
      return done(null, user);
    } catch (error) {
      return done(error);
    }
  }
));

// Google OAuth Strategy
if (process.env.GOOGLE_CLIENT_ID) {
  passport.use(new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.APP_URL}/api/auth/google/callback`,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await prisma.user.findUnique({ where: { googleId: profile.id } });
        if (!user) {
          user = await prisma.user.findUnique({ where: { email: profile.emails[0].value } });
          if (user) {
            user = await prisma.user.update({
              where: { id: user.id },
              data: { googleId: profile.id, emailVerified: true },
            });
          } else {
            user = await prisma.user.create({
              data: {
                email: profile.emails[0].value,
                fullName: profile.displayName,
                googleId: profile.id,
                avatar: profile.photos?.[0]?.value,
                emailVerified: true,
              },
            });
          }
        }
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }
  ));
}

module.exports = passport;
