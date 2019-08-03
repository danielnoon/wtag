import { Document, Schema } from 'mongoose';
import { Tag } from 'src/models/tag.model';

export const TagSchema = new Schema({
  name: String,
  createdBy: String
});

export interface ITagModel extends Document, Tag {}
