import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../shared/config.js';
import { userRepository, type UserEntity } from '../repositories/user.repository.js';
import { UnauthorizedError, ConflictError } from '../shared/errors.js';

const JWT_SECRET = config.JWT_SECRET;

export interface AuthUser {
  id: string;
  email: string;
  youtube_channel_id: string | null;
  youtube_channel_name: string | null;
  onboarding_completed: boolean;
  onboarding_step: number;
  auto_pitch_enabled: boolean;
}

function toAuthUser(entity: UserEntity): AuthUser {
  return {
    id: entity.id,
    email: entity.email,
    youtube_channel_id: entity.youtube_channel_id,
    youtube_channel_name: entity.youtube_channel_name,
    onboarding_completed: entity.onboarding_completed,
    onboarding_step: entity.onboarding_step,
    auto_pitch_enabled: entity.auto_pitch_enabled,
  };
}

export class AuthService {
  async register(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      throw new ConflictError('Email already exists');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await userRepository.create({ email, password_hash: passwordHash });
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

    return { token, user: toAuthUser(user) };
  }

  async login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Legacy users with placeholder password cannot login via password
    if (user.password_hash === 'LEGACY_MUST_SET_PASSWORD') {
      throw new UnauthorizedError('Please reset your password before logging in');
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return { token, user: toAuthUser(user) };
  }

  verifyToken(token: string): { userId: string; email: string } {
    try {
      const payload = jwt.verify(token, JWT_SECRET) as any;
      return { userId: payload.userId, email: payload.email };
    } catch {
      throw new UnauthorizedError('Invalid token');
    }
  }

  async getMe(userId: string): Promise<AuthUser | null> {
    const user = await userRepository.findById(userId);
    if (!user) return null;
    return toAuthUser(user);
  }
}

export const authService = new AuthService();
