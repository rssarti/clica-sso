/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'sso_secret',
    });
    console.log(
      '🔑 JWT Strategy initialized with secret length:',
      (process.env.JWT_SECRET || 'sso_secret').length,
    );
  }

  async validate(payload: any) {
    console.log('🔍 JWT Payload received:', payload);
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
      select: [
        'id',
        'email',
        'name',
        'document',
        'phone',
        'address',
        'address_json',
        'metadata',
        'createdAt',
        'updatedAt',
      ],
    });
    if (!user) {
      throw new UnauthorizedException(
        'Usuário não encontrado ou token inválido',
      );
    }
    return user;
  }
}
