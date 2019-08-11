import {
  Injectable,
  InternalServerErrorException,
  UnprocessableEntityException,
  UnauthorizedException
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
import axios from 'axios';

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
        if (await this.auth.verifyPermission(token, 'upload-images')) {
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
            const small = await sharp(file)
              .png()
              .resize(300, 300, {
                fit: 'contain',
                background: { r: 0, g: 0, b: 0, alpha: 0 }
              })
              .toBuffer();
            const smallFileName = this.uploadsDir + hash + '-thumbnail.png';
            await writeFile(smallFileName, small);
            await this.upload(smallFileName);
            const img = new this.imageModel({
              hash,
              name,
              tags: ['untagged'],
              uploaded: Date.now(),
              updated: Date.now()
            });
            await img.save();
            await unlink(fileName);
            resolve(hash);
          }
        } else {
          reject(new UnauthorizedException('Insufficient permissions.'));
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
    skip: number,
    sortBy: string = 'name'
  ) {
    if (await this.auth.verifyPermission(token, 'view')) {
      const yesTags = tags.filter(tag => tag[0] !== '-');
      const noTags = tags
        .filter(tag => tag[0] === '-')
        .map(tag => tag.substring(1));
      const results = await this.imageModel
        .find(
          tags.every(tag => tag === '')
            ? {}
            : yesTags.every(tag => tag === '')
            ? { tags: { $nin: noTags } }
            : noTags.every(tag => tag === '')
            ? { tags: { $in: yesTags } }
            : { tags: { $in: yesTags, $nin: noTags } }
        )
        .sort(sortBy)
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
      throw new UnauthorizedException('Insufficient permissions.');
    }
  }

  async setTags(token: string, tags: string[], hash: string) {
    if (await this.auth.verifyPermission(token, 'assign-tags')) {
      await this.tags.createTags(token, tags);
      const image = await this.imageModel.findOne({ hash });
      image.tags = tags;
      image.updated = Date.now();
      await image.save();
    } else {
      throw new UnauthorizedException('Insufficient permissions.');
    }
  }

  async getImageByHash(token: string, hash: string) {
    if (await this.auth.verifyPermission(token, 'view')) {
      const image = await this.imageModel.findOne({ hash });
      if (image) {
        return {
          baseUrl: this.getBaseUrl(),
          hash,
          fileExt: 'png',
          name: image.name,
          tags: image.tags
        };
      } else {
        throw new UnprocessableEntityException(
          'No image found with provided id.'
        );
      }
    }
  }

  async regenerateThumbnails(token: string) {
    if (await this.auth.verifyPermission(token, 'upload-images')) {
      if (this.uploadsDir === '') {
        this.uploadsDir = (await tmp.dir()).path + '/';
      }
      const images = await this.imageModel.find({});
      let i = 0;
      for (const image of images) {
        // tslint:disable-next-line:no-console
        console.log('On image ' + i);
        i++;
        const response = await axios({
          url: this.getBaseUrl() + '/' + image.hash + '.png',
          method: 'get',
          responseType: 'arraybuffer'
        });

        const small = await sharp(response.data)
          .png()
          .resize(300, 300, {
            fit: 'contain',
            background: { r: 0, g: 0, b: 0, alpha: 0 }
          })
          .toBuffer();
        const smallFileName = this.uploadsDir + image.hash + '-thumbnail.png';
        await writeFile(smallFileName, small);
        await this.upload(smallFileName);
      }
    } else {
      throw new UnauthorizedException('Insufficient permissions.');
    }
  }

  async deleteImage(token: string, hash: string) {
    if (await this.auth.verifyPermission(token, 'delete-images')) {
      try {
        const image = await this.imageModel.findOneAndDelete({ hash });
        if (image) {
          this.bucket.file(hash + '.png').delete();
          this.bucket.file(hash + '-thumbnail.png').delete();
          return true;
        } else {
          throw new UnprocessableEntityException('Image does not exist');
        }
      } catch (err) {
        throw new InternalServerErrorException();
      }
    }
  }

  async deduplicate(token: string) {
    if (await this.auth.verifyPermission(token, 'delete-images')) {
      const images = await this.imageModel.aggregate([
        {
          $group: {
            _id: '$hash',
            dups: { $addToSet: '$_id' },
            count: { $sum: 1 }
          }
        },
        {
          $match: {
            count: { $gt: 1 }
          }
        }
      ]);

      for (const image of images) {
        image.dups.shift();
        for (const dup of image.dups) {
          await this.imageModel.deleteOne({ _id: dup });
        }
      }

      return true;
    } else {
      throw new UnauthorizedException('Insufficient permissions.');
    }
  }
}
