import { Schema, Document } from 'mongoose';
import { Image } from 'src/models/image.model';

export const ImageSchema = new Schema({
  hash: String,
  name: String,
  tags: [String],
  uploaded: Date,
  updated: Date
});

export interface IImageModel extends Document, Image {}
