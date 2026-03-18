import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private usersService: UsersService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
      
    });
  }

 async validate(payload: any) {
  console.log('JWT payload logic:', payload);
  // Возвращаем простой объект. Теперь req.user.id — это точно строка.
  return { 
    id: payload.sub, 
    phone: payload.phone, 
    role: payload.role 
  };
 }}