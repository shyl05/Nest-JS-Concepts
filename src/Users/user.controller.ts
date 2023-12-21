import {
  Controller,
  Get,
  Post,
  Body,
  Res,
  Param,
  Delete,
  HttpException,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.interface';
import { AuthGuard } from './Auth/auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create(@Res() res, @Body() req: User) {
    try {
      const { email } = req;

      const existingUser = await this.userService.findByEmail(email);

      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists' });
      }

      const user = await this.userService.create(req);
      return res.status(201).json(user);
    } catch (error) {
      throw new HttpException(
        {
          status: HttpStatus.BAD_REQUEST,
          error: 'Check your request',
        },
        HttpStatus.BAD_REQUEST,
        {
          cause: error,
        },
      );
    }
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(@Res({ passthrough: true }) response): Promise<User[]> {
    response.cookie('cookie', process.env.COOKIE_SECRET);
    return this.userService.findAll();
  }

  @Get(':email')
  async findByEmail(@Param('email') email: string): Promise<User> {
    return this.userService.findByEmail(email);
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<User> {
    return this.userService.findOne(id);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async delete(@Res() res, @Param('id') id: string): Promise<any> {
    const existingUser = await this.userService.findOne(id);

    if (existingUser) {
      this.userService.delete(id);
      return res
        .status(200)
        .json({ message: 'User Successfully Deleted', id: id });
    } else {
      return res.status(400).json({ message: 'User Not Found' });
    }
  }

  @Post('login')
  async signIn(@Res() res, @Body() req: User): Promise<any> {
    const token = await this.userService.signIn(req.email, req.password);
    return res.status(200).json({ jwt_token: token });
  }
}
