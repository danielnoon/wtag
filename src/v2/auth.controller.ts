import { Body, Controller, Get, Post } from '@nestjs/common';
import { RegisterDto } from '../dto/register.dto';
import { AuthService } from '../auth.service';
import { LoginDto } from '../dto/login.dto';

@Controller('api/v2/auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Get('/init')
  async init() {
    const code = await this.auth.init();
    return { authCode: code };
  }

  @Post('/register')
  async register(@Body() body: RegisterDto) {
    const token = await this.auth.register(body);
    return { token };
  }

  @Post('/login')
  async login(@Body() body: LoginDto) {
    const token = await this.auth.login(body);
    return { token };
  }
}
