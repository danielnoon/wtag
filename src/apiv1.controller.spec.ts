import { Test, TestingModule } from '@nestjs/testing';
import { ApiV1 } from './apiv1.controller';
import { AuthService } from './auth.service';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema } from './db/User.schema';
import * as de from 'dotenv';
import { AccessCodeSchema } from './db/AccesCode.schema';
import { ImageSchema } from './db/Image.schema';
import { TagSchema } from './db/Tag.schema';
import { ImageService } from './image.service';
import { TagService } from './tag.service';
import * as fs from 'fs';
const { readFile } = fs.promises;

de.config();

describe('AppController', () => {
  let appController: ApiV1;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [ApiV1],
      providers: [AuthService, ImageService, TagService],
      imports: [
        MongooseModule.forRoot(process.env.TEST_MONGO_URL, {
          useNewUrlParser: true
        }),
        MongooseModule.forFeature([{ name: 'Image', schema: ImageSchema }]),
        MongooseModule.forFeature([{ name: 'User', schema: UserSchema }]),
        MongooseModule.forFeature([{ name: 'Tag', schema: TagSchema }]),
        MongooseModule.forFeature([
          { name: 'AccessCode', schema: AccessCodeSchema }
        ])
      ]
    }).compile();

    appController = app.get<ApiV1>(ApiV1);
  });

  describe('API', () => {
    let accessCode = '';
    let token = '';
    let imageHash = '';
    const username = 'daniel';
    const password = 'abc123';
    it('should return welcome message', () => {
      expect(appController.baseMessage()).toBe(`You've reached the WTag API!`);
    });
    it('should return an access token on first init', async done => {
      await appController.wipeDB();
      const res = await appController.initialize();
      expect(res.authCode).toBeDefined();
      accessCode = res.authCode || '';
      done();
    });
    it('should make an account with authcode', async done => {
      const res = await appController.register({
        username,
        password,
        accessCode
      });
      expect(res.token).toBeDefined();
      token = res.token || '';
      done();
    });
    it('should not return an access token on subsequent inits', async done => {
      expect(appController.initialize()).rejects.toThrow();
      done();
    });
    it('should accept login', async done => {
      const res = await appController.login({
        username,
        password
      });
      expect(res.token).toBeDefined();
      token = res.token || '';
      done();
    });
    it('should create new access token', async done => {
      const res = await appController.newAccessCode(token, 'visitor');
      expect(res.authCode).toBeDefined();
      accessCode = res.authCode || '';
      done();
    });
    it('should not allow arbitrary roles', async done => {
      expect(
        appController.newAccessCode(token, 'cocksucker')
      ).rejects.toThrow();
      done();
    });
    it('should upload image', async done => {
      const image = await readFile('test/remington.png');
      const { hash } = await appController.uploadImage(
        token,
        { buffer: image },
        'Test Image'
      );
      imageHash = hash;
      done();
    });
    it('should get all images', async done => {
      const res = await appController.getImages(token, '', '0', '10', 'name');
      expect(res.images.length).toBeTruthy();
      done();
    });
    it('should get one image', async done => {
      const res = await appController.getImage(token, imageHash);
      expect(res.image.tags).toBeTruthy();
      done();
    });
    it('should get untagged images', async done => {
      const res = await appController.getImages(
        token,
        'untagged',
        '0',
        '10',
        'name'
      );
      expect(res.images.length).toBeTruthy();
      done();
    });
    it('should tag images', async done => {
      const res = await appController.applyTags(token, {
        image: imageHash,
        tags: ['black-and-white', 'gun-maker', '19th-century']
      });
      expect(res.success).toBeTruthy();
      done();
    });
    it('should get all tags', async done => {
      const res = await appController.getAllTags(token);
      expect(res.tags.length > 2).toBeTruthy();
      done();
    });
    it('should get images with negation', async done => {
      const res = await appController.getImages(
        token,
        '-untagged',
        '0',
        '10',
        'name'
      );
      expect(res.images.length === 1).toBeTruthy();
      done();
    });
  });
});
