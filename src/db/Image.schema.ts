import * as mongoose from 'mongoose';

export const ImageSchema = new mongoose.Schema({
  url: String,
  name: String
});
