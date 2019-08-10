import {
  Controller,
  Get,
  Post,
  Body,
  Headers,
  ForbiddenException,
  Put,
  UseInterceptors,
  UploadedFile,
  Query,
  Delete
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { NewAccessCodeDto } from './dto/new-access-code.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageService } from './image.service';
import { ApplyTagsDto } from './dto/apply-tags.dto';
import { TagService } from './tag.service';

@Controller('api/v1')
export class ApiV1 {
  constructor(
    private readonly auth: AuthService,
    private readonly image: ImageService,
    private readonly tags: TagService
  ) {}

  async wipeDB() {
    await this.auth.wipeDB();
    await this.image.wipeDB();
  }

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

  @Get('new-access-code')
  async newAccessCode(
    @Headers('auth-token') token: string,
    @Query('role') role: string
  ) {
    if (!token) {
      throw new ForbiddenException('Token not provided.');
    }
    const code = await this.auth.generateAccessCode(token, role);
    return {
      authCode: code
    };
  }

  @Put('new-image')
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @Headers('auth-token') token: string,
    @UploadedFile() file,
    @Query('name') name
  ) {
    const hash = await this.image.newImage(token, file.buffer, name);
    return { hash };
  }

  @Get('images')
  async getImages(
    @Headers('auth-token') token: string,
    @Query('tags') tags: string,
    @Query('skip') skip: string,
    @Query('max') max: string,
    @Query('sort-by') sortBy: string
  ) {
    const images = await this.image.getImagesByTags(
      token,
      tags.split(','),
      parseInt(max, 10),
      parseInt(skip, 10),
      sortBy
    );
    return { images };
  }

  @Get('image')
  async getImage(
    @Headers('auth-token') token: string,
    @Query('hash') hash: string
  ) {
    const image = await this.image.getImageByHash(token, hash);
    return { image };
  }

  @Post('apply-tags')
  async applyTags(
    @Headers('auth-token') token: string,
    @Body() body: ApplyTagsDto
  ) {
    await this.image.setTags(token, body.tags, body.image);
    return {
      success: true
    };
  }

  @Get('tags')
  async getAllTags(@Headers('auth-token') token: string) {
    const tags = await this.tags.getAllTags(token);
    return { tags };
  }

  @Post('regenerate-thumbnails')
  async regenThumbnails(@Headers('auth-token') token: string) {
    await this.image.regenerateThumbnails(token);
    return { status: 'complete' };
  }

  @Delete('image')
  async deleteImage(
    @Headers('auth-token') token: string,
    @Query('hash') hash: string
  ) {
    const success = await this.image.deleteImage(token, hash);
    if (success) {
      return {
        success
      };
    }
  }
}
