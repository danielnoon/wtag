import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthService } from './auth.service';
import { ApiV1 } from './apiv1.controller';
import { MongooseModule } from '@nestjs/mongoose';
import * as de from 'dotenv';
import { UserSchema } from './db/User.schema';
import { AccessCodeSchema } from './db/AccesCode.schema';
import { ImageService } from './image.service';
import { ImageSchema } from './db/Image.schema';
import { TagSchema } from './db/Tag.schema';
import { TagService } from './tag.service';

de.config();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URL, { useNewUrlParser: true }),
    MongooseModule.forFeature([{ name: 'Image', schema: ImageSchema }]),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    MongooseModule.forFeature([{ name: 'Tag', schema: TagSchema }]),
    MongooseModule.forFeature([
      { name: 'AccessCode', schema: AccessCodeSchema }
    ])
  ],
  controllers: [AppController, ApiV1],
  providers: [AppService, AuthService, ImageService, TagService]
})
export class AppModule {}
