import { Document, Schema } from 'mongoose';
import { User } from 'src/models/user.model';

export const UserSchema = new Schema({
  username: String,
  password: String,
  oldestAvailableToken: Date,
  role: String
});

export interface IUserModel extends Document, User {}
