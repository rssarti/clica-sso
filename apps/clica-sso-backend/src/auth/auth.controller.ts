/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto.email, loginDto.password);
  }

  @Get('test')
  getTest(@Request() req): any {
    console.log(req.headers); // Verifica se o Authorization está chegando
    console.log(req.user); // Verifica se o token foi decodificado

    return {
      headers: req.headers,
      user: req.user,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @HttpCode(HttpStatus.OK)
  getProfile(@Request() req: { user: any }): any {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  validateToken(@Request() req: { user: any }): { valid: boolean; user: any } {
    return {
      valid: true,
      user: req.user,
    };
  }
}
