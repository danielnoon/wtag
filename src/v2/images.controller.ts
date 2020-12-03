import {
  Controller,
  Post,
  Query,
  UploadedFile,
  Headers,
  UseInterceptors,
  Get,
  Param,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageService } from '../image.service';

@Controller('api/v2/images')
export class ImageController {
  constructor(private images: ImageService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async uploadImage(
    @Headers('auth-token') token: string,
    @UploadedFile() file: { buffer: Buffer },
    @Query('name') name: string
  ) {
    const hash = await this.images.newImage(token, file.buffer, name);
    return { hash };
  }

  @Get()
  async getImages(
    @Headers('auth-token') token: string,
    @Query('tags') tags: string = '',
    @Query('skip') skip: string = '0',
    @Query('max') max: string = '50',
    @Query('sort-by') sortBy: string = 'name'
  ) {
    const tagList = tags.split(/([,\s])+/g).filter((t) => t);
    const images = await this.images.getImagesByTags(
      token,
      tagList,
      parseInt(max),
      parseInt(skip),
      sortBy
    );
    return { images };
  }

  @Get(':hash')
  async getImage(
    @Headers('auth-token') token: string,
    @Param('hash') hash: string
  ) {
    const image = await this.images.getImageByHash(token, hash);
    return { image };
  }
}
