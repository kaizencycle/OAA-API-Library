// Auth module exports
// Centralized exports for authentication utilities

export { AuthService } from './authService';
export type { RegisterInput, LoginResult } from './authService';

export {
  generateJWT,
  verifyJWT,
  decodeJWT,
  extractBearerToken,
  isTokenExpiring,
  generateRefreshToken,
} from './jwt';
export type { TokenPayload } from './jwt';
