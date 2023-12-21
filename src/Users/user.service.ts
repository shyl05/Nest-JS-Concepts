import {
  HttpException,
  HttpStatus,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { User } from './user.schema';
import { CreateUserDto } from './Dto/user.dto';
import * as bcrypt from 'bcrypt';
const saltRounds = 10;

@Injectable()
export class UserService implements OnModuleInit {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  //Lifecycle hooks
  onModuleInit() {
    console.log(`User module has been initialized.`);
  }

  // BCRYPT Hashing
  async convertToHash(password: string) {
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    return hashedPassword;
  }

  async compareHashes(password: string, hashed: string) {
    const match = await bcrypt.compare(password, hashed);
    return match;
  }

  //Find User By Email
  async findByEmail(email: string): Promise<User> {
    return this.userModel.findOne({ email }).exec();
  }

  //Create User
  async create(createUserDto: CreateUserDto) {
    createUserDto.password = await this.convertToHash(createUserDto.password);
    const newUser = new this.userModel(createUserDto);
    await newUser.save();
    return {
      message: 'User registered successfully',
    };
  }

  //Find All Users
  async findAll(): Promise<User[]> {
    return this.userModel.find();
  }

  //Find User By Id
  async findOne(id: string): Promise<User> {
    return this.userModel.findOne({ _id: id }).exec();
  }

  //Delete User By Id
  async delete(id: string): Promise<any> {
    const deletedUser = await this.userModel
      .findByIdAndDelete({ _id: id })
      .exec();
    return deletedUser;
  }

  //Signin
  async signIn(email: string, password: string) {
    const user = await this.userModel.findOne({ email }).exec();
    const isMatch = await this.compareHashes(password, user.password);
    if (isMatch) {
      const payload = { email: user.email, password: user.password };
      const access_token = await this.jwtService.signAsync(payload);
      return access_token;
    } else {
      throw new HttpException(
        'Wrong credentials provided',
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
