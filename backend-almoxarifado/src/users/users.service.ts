import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity.js';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Cria um novo usuário no banco de dados com a senha criptografada.
   */
  async create(username:string, email: string, passwordPlain: string): Promise<User> {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(passwordPlain, salt);

    const user = this.userRepository.create({
      name: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
    });

    return await this.userRepository.save(user);
  }

  /**
   * Busca um usuário pelo nome ou e-mail.
   */
  async findOne(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }

  /**
   * Busca um usuário pelo ID primário do banco de dados.
   */
  async findById(id: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
    });
  }
  
  async updatePassword(userId: number, newPasswordHash: string): Promise<void> {
  await this.userRepository.update(userId, {
    passwordHash: newPasswordHash,
  });
  }
  
  async updateEmail(userId: number, newEmail: string) {
  return this.userRepository.update(userId, { email: newEmail });
  }
}