import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { EditUserDto } from './dto/edit-user.dto';
import { ValidateObjectId } from '@app/common';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  async getUsers() {
    return this.usersService.fetchAll();
  }

  @Get(':id')
  async getUserById(@Param('id', ValidateObjectId) id: string) {
    return this.usersService.fetchById(id);
  }

  @Post('create')
  @UseInterceptors(FileInterceptor('file'))
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @UploadedFile() profilePictureFile?: Express.Multer.File,
  ) {
    return this.usersService.create(createUserDto, profilePictureFile);
  }

  @Patch('update/:id')
  @UseInterceptors(FileInterceptor('file'))
  async updateUser(
    @Param('id', ValidateObjectId) id: string,
    @Body() updateUserDto: EditUserDto,
    @UploadedFile() profilePictureFile?: Express.Multer.File,
  ) {
    return this.usersService.update(id, updateUserDto, profilePictureFile);
  }

  // JUST FOR DEVELOPMENT
  // DON'T USE IT IN PRODUCTION
  @Delete('delete/all')
  async deleteAll() {
    return this.usersService.deleteAll();
  }

  @Delete('delete/:id')
  async deleteUser(@Param('id', ValidateObjectId) id: string) {
    return this.usersService.delete(id);
  }
}
