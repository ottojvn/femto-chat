import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async signIn(
    email: string,
    password: string,
  ): Promise<{ access_token: string }> {
    const result = await this.usersService.findByEmail(email);
    if (!result) {
      throw new UnauthorizedException('User not found');
    }

    if (!(await bcrypt.compare(password, result.passwordHash))) {
      throw new UnauthorizedException('Invalid password');
    }

    const { passwordHash, ...user } = result;

    return {
      access_token: await this.jwtService.signAsync({
        email: user.email,
        sub: user.id,
      }),
    };
  }
}
