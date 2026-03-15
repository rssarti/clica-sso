/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { UpdateUserProfileDto } from './dto/update-user-profile.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async create(userData: Partial<User>): Promise<User> {
    if (!userData.password || typeof userData.password !== 'string') {
      throw new Error('Password is required and must be a string');
    }
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });
    return this.userRepository.save(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findById(id: number): Promise<User | null> {
    return this.userRepository.findOne({ where: { id } });
  }

  async getProfile(userId: number): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      select: [
        'id',
        'email',
        'name',
        'document',
        'phone',
        'address',
        'address_json',
        'metadata',
        'createdAt',
        'updatedAt',
      ],
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return user;
  }

  async updateProfile(
    userId: number,
    updateUserProfileDto: UpdateUserProfileDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    // Verificar se o email já existe (se está sendo alterado)
    if (
      updateUserProfileDto.email &&
      updateUserProfileDto.email !== user.email
    ) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserProfileDto.email },
      });

      if (existingUser) {
        throw new ConflictException(
          'Este email já está sendo usado por outro usuário',
        );
      }
    }

    // Hash da nova senha se fornecida
    if (updateUserProfileDto.password) {
      updateUserProfileDto.password = await bcrypt.hash(
        updateUserProfileDto.password,
        10,
      );
    }

    // Atualizar dados do usuário
    Object.assign(user, updateUserProfileDto);
    await this.userRepository.save(user);

    // Retornar usuário sem a senha
    const { password, ...userProfile } = user;
    return userProfile;
  }
}
