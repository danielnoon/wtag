import { Document, Schema } from 'mongoose';
import { AccessCode } from 'src/models/access-code.model';

export const AccessCodeSchema = new Schema({
  code: String,
  role: String
});

export interface IAccessCodeModel extends Document, AccessCode {}
