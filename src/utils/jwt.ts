import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET as string;
const EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d';

export const signToken = (userId: string, role: string): string => {
  return jwt.sign({ id: userId, role }, SECRET, { expiresIn: EXPIRES_IN } as jwt.SignOptions);
};

export const verifyToken = (token: string): jwt.JwtPayload => {
  return jwt.verify(token, SECRET) as jwt.JwtPayload;
};
