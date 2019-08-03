import {
  Injectable,
  ForbiddenException,
  UnprocessableEntityException
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as uuid from 'uuid';
import { IUserModel } from './db/User.schema';
import { RegisterDto } from './dto/register.dto';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { IToken } from './models/token.model';
import { LoginDto } from './dto/login.dto';
import { IAccessCodeModel } from './db/AccesCode.schema';

@Injectable()
export class AuthService {
  // private accessCodes: Array<{ role: string; code: string }> = [];
  private permissions = new Map<string, Set<string>>([
    [
      'owner',
      new Set([
        'create-accounts',
        'create-admin-accounts',
        'upload-images',
        'delete-images',
        'create-tags',
        'assign-tags',
        'edit-tags',
        'delete-tags',
        'view'
      ])
    ],
    [
      'admin',
      new Set([
        'create-accounts',
        'upload-images',
        'delete-images',
        'create-tags',
        'assign-tags',
        'edit-tags',
        'delete-tags',
        'view'
      ])
    ],
    [
      'mod',
      new Set([
        'upload-images',
        'delete-images',
        'create-tags',
        'assign-tags',
        'edit-tags',
        'delete-tags',
        'view'
      ])
    ],
    [
      'tagger',
      new Set([
        'create-tags',
        'assign-tags',
        'edit-tags',
        'delete-tags',
        'view'
      ])
    ],
    ['visitor', new Set(['view'])]
  ]);

  constructor(
    @InjectModel('User') private readonly userModel: Model<IUserModel>,
    @InjectModel('AccessCode')
    private readonly accessCodeModel: Model<IAccessCodeModel>
  ) {}

  async wipeDB() {
    await this.userModel.deleteMany({});
    await this.accessCodeModel.deleteMany({});
  }

  generateJWT(userId: string) {
    const payload: IToken = {
      iat: Date.now(),
      id: userId
    };
    const token = jwt.sign(payload, process.env.JWT_SECRET);
    return token;
  }

  verifyJWT(token: string) {
    return jwt.verify(token, process.env.JWT_SECRET) as IToken;
  }

  async newAccessCode(role: string) {
    const code = uuid.v4();
    const codeObject = new this.accessCodeModel({ role, code });
    await codeObject.save();
    return code;
  }

  async verifyPermission(token: string, permission: string) {
    const { id } = this.verifyJWT(token);
    const user = await this.userModel.findById(id);
    if (user) {
      if (this.permissions.has(user.role)) {
        const permissions = this.permissions.get(user.role)!;
        if (permissions.has(permission)) {
          return true;
        } else {
          return false;
        }
      }
    } else {
      throw new UnprocessableEntityException('Invalid or missing token.');
    }
  }

  init() {
    return new Promise<string>(async (resolve, reject) => {
      const numUsers = await this.userModel.estimatedDocumentCount();
      if (numUsers === 0) {
        const code = await this.newAccessCode('owner');
        resolve(code);
      } else {
        reject(new ForbiddenException('Admin has already been created.'));
      }
    });
  }

  register({ username, accessCode, password }: RegisterDto) {
    return new Promise<string>(async (resolve, reject) => {
      const access = await this.accessCodeModel.findOne({ code: accessCode });
      if (access) {
        if ((await this.userModel.countDocuments({ username })) === 0) {
          const hash = await bcrypt.hash(password, 10);
          const user = new this.userModel({
            username,
            password: hash,
            role: access.role,
            oldestAvailableToken: Date.now()
          });
          const newUser = await user.save();
          this.accessCodeModel.deleteOne({ code: accessCode });
          resolve(this.generateJWT(newUser.id));
        } else {
          reject(new UnprocessableEntityException('User already exists.'));
        }
      } else {
        reject(new UnprocessableEntityException('Invalid access code.'));
      }
    });
  }

  login({ username, password }: LoginDto) {
    return new Promise<string>(async (resolve, reject) => {
      const user = await this.userModel.findOne({ username });
      if (user) {
        if (await bcrypt.compare(password, user.password)) {
          resolve(this.generateJWT(user.id));
        } else {
          reject(new UnprocessableEntityException('Password is incorrect.'));
        }
      } else {
        reject(new UnprocessableEntityException('Account does not exist.'));
      }
    });
  }

  async generateAccessCode(token: string, role: string) {
    if (this.permissions.has(role) && role !== 'owner') {
      const necessaryPermission =
        role === 'admin' ? 'create-admin-accounts' : 'create-accounts';
      if (await this.verifyPermission(token, necessaryPermission)) {
        const code = await this.newAccessCode(role);
        return code;
      } else {
        throw new ForbiddenException('Insufficient permissions.');
      }
    } else {
      throw new UnprocessableEntityException('Invalid role.');
    }
  }
}
