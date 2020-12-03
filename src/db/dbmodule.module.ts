import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccessCodeSchema } from './AccessCode.schema';
import { ImageSchema } from './Image.schema';
import { TagSchema } from './Tag.schema';
import { UserSchema } from './User.schema';

@Module({
  imports: [MongooseModule],
  exports: [
    MongooseModule.forRoot(process.env.MONGO_URL, { useNewUrlParser: true }),
    MongooseModule.forFeature([{ name: 'Image', schema: ImageSchema }]),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
    MongooseModule.forFeature([{ name: 'Tag', schema: TagSchema }]),
    MongooseModule.forFeature([
      { name: 'AccessCode', schema: AccessCodeSchema },
    ]),
  ],
})
export class DBModule {}
