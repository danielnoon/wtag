import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  ForbiddenException
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { NewAccessCodeDto } from './dto/new-access-code.dto';

@Controller('api/v1')
export class ApiV1 {
  constructor(private readonly auth: AuthService) {}

  @Get()
  baseMessage() {
    return `You've reached the WTag API!`;
  }

  @Post('login')
  async login(@Body() body: LoginDto) {
    const token = await this.auth.login(body);
    return { token };
  }

  @Post('register')
  async register(@Body() body: RegisterDto) {
    const token = await this.auth.register(body);
    return { token };
  }

  @Get('init')
  async initialize() {
    const code = await this.auth.init();
    return { authCode: code };
  }

  @Post('generate-access-code')
  async newAccessCode(
    @Body() body: NewAccessCodeDto,
    @Headers('auth-token') token: string
  ) {
    if (!token) {
      throw new ForbiddenException('Token not provided.');
    }
    const code = await this.auth.generateAccessCode(token, body.role);
    return {
      authCode: code
    };
  }
}
