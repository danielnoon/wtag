import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ITagModel } from './db/Tag.schema';
import { AuthService } from './auth.service';

@Injectable()
export class TagService {
  constructor(
    @InjectModel('Tag') private tagModel: Model<ITagModel>,
    private auth: AuthService
  ) {}

  async createTags(token: string, tags: string[]) {
    await this.auth.verifyPermission(token, 'view');
    const existing = await this.tagModel.find({
      $or: tags.map(tag => ({ name: tag }))
    });
    if (existing.length !== tags.length) {
      const user = this.auth.verifyJWT(token);
      await this.auth.verifyPermission(token, 'create-tags');
      const missing = tags.filter(tag => !existing.find(ex => ex.name === tag));
      for (const tag of missing) {
        const newTag = new this.tagModel({ name: tag, createdBy: user.id });
        await newTag.save();
      }
    }
  }
}
