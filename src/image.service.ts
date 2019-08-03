import {
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException
} from '@nestjs/common';
import { Storage } from '@google-cloud/storage';
import * as de from 'dotenv';
import { AuthService } from './auth.service';
import * as fs from 'fs';
import * as hasha from 'hasha';
import * as sharp from 'sharp';
import { InjectModel } from '@nestjs/mongoose';
import { IImageModel } from './db/Image.schema';
import { Model } from 'mongoose';
import { TagService } from './tag.service';
import * as tmp from 'tmp-promise';

const { writeFile, mkdir, unlink } = fs.promises;
const exists = (path: string) =>
  new Promise((resolve, reject) => {
    fs.exists(path, yes => resolve(yes));
  });

de.config();

@Injectable()
export class ImageService {
  private readonly storage = new Storage();
  private bucket = this.storage.bucket(process.env.GCP_BUCKET_NAME);
  private uploadsDir = '';

  constructor(
    private auth: AuthService,
    private tags: TagService,
    @InjectModel('Image') private imageModel: Model<IImageModel>
  ) {}

  async wipeDB() {
    await this.imageModel.deleteMany({});
    await this.tags.wipeDB();
  }

  async upload(file: string) {
    await this.bucket.upload(file, {
      gzip: true,
      metadata: {
        cacheControl: 'public, max-age=31536000'
      }
    });
  }

  newImage(token: string, file: Buffer, name: string) {
    return new Promise<string>(async (resolve, reject) => {
      try {
        if (this.auth.verifyPermission(token, 'upload-images')) {
          const png = await sharp(file)
            .png()
            .toBuffer();
          const hash = hasha(png, { algorithm: 'sha1' });
          if (await this.imageModel.findOne({ hash })) {
            reject(new UnprocessableEntityException('Image already exists.'));
          } else {
            if (this.uploadsDir === '') {
              this.uploadsDir = (await tmp.dir()).path + '/';
            }
            const fileName = this.uploadsDir + hash + '.png';
            await writeFile(fileName, png);
            await this.upload(fileName);
            const img = new this.imageModel({
              hash,
              name,
              tags: ['untagged']
            });
            await img.save();
            await unlink(fileName);
            resolve(hash);
          }
        } else {
          reject('Invalid permissions.');
        }
      } catch (err) {
        reject(new InternalServerErrorException(err));
      }
    });
  }

  getBaseUrl() {
    return `https://storage.googleapis.com/${process.env.GCP_BUCKET_NAME}`;
  }

  async getImagesByTags(
    token: string,
    tags: string[],
    max: number,
    skip: number
  ) {
    if (this.auth.verifyPermission(token, 'view')) {
      const results = await this.imageModel
        .find(tags.every(tag => tag === '') ? {} : { tags: { $in: tags } })
        .limit(max)
        .skip(skip);
      return results.map(res => ({
        baseUrl: this.getBaseUrl(),
        hash: res.hash,
        fileExt: 'png',
        name: res.name,
        tags: res.tags
      }));
    } else {
      throw new UnprocessableEntityException('Insufficient permissions.');
    }
  }

  async setTags(token: string, tags: string[], hash: string) {
    await this.tags.createTags(token, tags);
    const image = await this.imageModel.findOne({ hash });
    image.tags = tags;
    await image.save();
  }
}
