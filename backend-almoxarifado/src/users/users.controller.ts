import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UsersService, SafeUserResponse } from './users.service.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';
import { JwtAuthGuard } from '../auth/jwt-auth.guard.js';
import { RolesGuard } from '../auth/roles.guard.js';
import { Roles } from '../auth/roles.decorator.js';
import { UserRole } from './entities/user.entity.js';

/**
 * Controller responsável pela gestão e administração de contas de usuários do sistema.
 * Todas as operações exigem autenticação válida e papel de Administrador (ADMIN).
 */
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Lista todos os usuários cadastrados no almoxarifado.
   * Rota: GET /users
   */
  @Get()
  async findAll(): Promise<SafeUserResponse[]> {
    return await this.usersService.findAll();
  }

  /**
   * Retorna os detalhes de um usuário específico por ID.
   * Rota: GET /users/:id
   */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<SafeUserResponse> {
    return await this.usersService.findOneById(id);
  }

  /**
   * Cria uma nova conta de usuário no sistema com perfil definido pelo Administrador.
   * Rota: POST /users
   */
  @Post()
  async create(@Body() createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Atualiza dados cadastrais, perfil de acesso (Role) ou senha de um usuário.
   * Rota: PUT /users/:id
   */
  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<SafeUserResponse> {
    return await this.usersService.update(id, updateUserDto);
  }

  /**
   * Exclui a conta de um usuário do sistema.
   * Impede que o próprio administrador logado se autoexclua.
   * Rota: DELETE /users/:id
   */
  @Delete(':id')
  async remove(@Request() req: any, @Param('id', ParseIntPipe) id: number): Promise<{ message: string }> {
    const currentUserId = req.user?.userId;
    return await this.usersService.remove(id, currentUserId);
  }
}


