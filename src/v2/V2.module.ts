import { Module } from '@nestjs/common';
import { ImageController } from './images.controller';
import { ImageService } from '../image.service';
import { AuthService } from '../auth.service';
import { TagService } from '../tag.service';
import { DBModule } from '../db/dbmodule.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ImageSchema } from '../db/Image.schema';
import { UserSchema } from '../db/User.schema';
import { TagSchema } from '../db/Tag.schema';
import { AccessCodeSchema } from '../db/AccessCode.schema';
import { AuthController } from './auth.controller';

@Module({
  imports: [
    // MongooseModule.forRoot(process.env.MONGO_URL, { useNewUrlParser: true }),
    MongooseModule.forFeature([{ name: 'Image', schema: ImageSchema }]),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    MongooseModule.forFeature([{ name: 'Tag', schema: TagSchema }]),
    MongooseModule.forFeature([
      { name: 'AccessCode', schema: AccessCodeSchema },
    ]),
  ],
  controllers: [ImageController, AuthController],
  providers: [AuthService, ImageService, TagService],
})
export class V2Module {}
