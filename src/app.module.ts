import * as de from 'dotenv';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { V2Module } from './v2/V2.module';

import { AppController } from './app.controller';
import { ApiV1 } from './apiv1.controller';

import { AppService } from './app.service';
import { AuthService } from './auth.service';
import { TagService } from './tag.service';

import { UserSchema } from './db/User.schema';
import { AccessCodeSchema } from './db/AccessCode.schema';
import { ImageService } from './image.service';
import { ImageSchema } from './db/Image.schema';
import { TagSchema } from './db/Tag.schema';

de.config();

@Module({
  imports: [
    V2Module,
    MongooseModule.forRoot(process.env.MONGO_URL, { useNewUrlParser: true }),
    MongooseModule.forFeature([{ name: 'Image', schema: ImageSchema }]),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    MongooseModule.forFeature([{ name: 'Tag', schema: TagSchema }]),
    MongooseModule.forFeature([
      { name: 'AccessCode', schema: AccessCodeSchema },
    ]),
  ],
  controllers: [AppController, ApiV1],
  providers: [AppService, AuthService, ImageService, TagService],
})
export class AppModule {}
