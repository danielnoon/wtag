import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthService } from './auth.service';
import { ApiV1 } from './apiv1.controller';
import { MongooseModule } from '@nestjs/mongoose';
import * as de from 'dotenv';
import { UserSchema } from './db/User.schema';

de.config();

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGO_URL, { useNewUrlParser: true }),
    MongooseModule.forFeature([{ name: 'User', schema: UserSchema }])
  ],
  controllers: [AppController, ApiV1],
  providers: [AppService, AuthService]
})
export class AppModule {}
