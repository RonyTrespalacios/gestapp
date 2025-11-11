import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { EmailService } from './email.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async register(registerDto: RegisterDto) {
    const user = await this.usersService.create(registerDto);

    // Enviar email de verificación
    await this.emailService.sendVerificationEmail(
      user.email,
      user.verificationToken,
    );

    return {
      message: 'Usuario registrado. Por favor verifica tu email.',
      email: user.email,
    };
  }

  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const isPasswordValid = await this.usersService.validatePassword(
      loginDto.password,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (!user.isVerified) {
      throw new UnauthorizedException('Por favor verifica tu email primero');
    }

    const payload = { sub: user.id, email: user.email };
    const accessToken = this.jwtService.sign(payload);

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    };
  }

  async verifyEmail(token: string) {
    try {
      const user = await this.usersService.verifyEmail(token);
      return {
        message: 'Email verificado exitosamente. Ya puedes iniciar sesión.',
        email: user.email,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async validateUser(userId: number) {
    return await this.usersService.findById(userId);
  }
}

