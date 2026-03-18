import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // ─── Регистрация ───────────────────────────────────────────────
  async register(dto: CreateUserDto, ownerId?: string) {
    return this.usersService.create(dto, ownerId);
  }

  // ─── Логин ─────────────────────────────────────────────────────
  async login(dto: LoginDto) {
    const user = await this.userRepository.findOne({
      where: { phone: dto.phone },
      select: ['id', 'phone', 'password', 'role', 'firstName', 'lastName'],
    });

    if (!user) throw new UnauthorizedException('Неверный номер или пароль');

    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Неверный номер или пароль');

    const tokens = await this.generateTokens(user.id, user.phone, user.role);
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    delete user.password;
    return { user, ...tokens };
  }

  // ─── Выход ─────────────────────────────────────────────────────
  async logout(userId: string) {
    await this.userRepository.update(userId, { refreshToken: null });
    return { message: 'Вы успешно вышли' };
  }

  // ─── Обновление токенов ────────────────────────────────────────
  async refreshTokens(userId: string) {
    const tokens = await this.generateTokens(userId, '', '');
    await this.saveRefreshToken(userId, tokens.refreshToken);
    return tokens;
  }

  // ─── Валидация refresh token ───────────────────────────────────
  async validateRefreshToken(userId: string, refreshToken: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: ['id', 'phone', 'role', 'refreshToken'],
    });

    if (!user?.refreshToken) throw new UnauthorizedException();

    const tokenMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!tokenMatch) throw new UnauthorizedException('Refresh token невалиден');

    return user;
  }

  // ─── Вспомогательные методы ────────────────────────────────────
  private async generateTokens(userId: string, phone: string, role: string) {
    const payload = { sub: userId, phone, role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '7d',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, refreshToken: string) {
    const hashed = await bcrypt.hash(refreshToken, 10);
    await this.userRepository.update(userId, { refreshToken: hashed });
  }
}