import { Injectable, NotFoundException, ConflictException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from './entities/user.entity.js';
import { CreateUserDto } from './dto/create-user.dto.js';
import { UpdateUserDto } from './dto/update-user.dto.js';

/**
 * Interface que representa a visualização segura de um usuário sem dados sensíveis (sem hash de senha).
 */
export interface SafeUserResponse {
  id: number;
  name: string;
  email: string;
  role: UserRole;
  movementsCount?: number;
}

/**
 * Serviço responsável pela gestão das contas de usuários do sistema de almoxarifado,
 * incluindo criação, alteração de permissões (roles), consultas e exclusão.
 */
@Injectable()
export class UsersService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Inicialização do módulo: Assegura que haja pelo menos um usuário com perfil ADMIN.
   * Promove o primeiro usuário cadastrado ou quem possuir e-mail de administrador.
   */
  async onModuleInit() {
    try {
      // 1. Assegura que o usuário felipecoes08@gmail.com tenha perfil de Administrador (ADMIN)
      const targetAdmin = await this.userRepository.findOne({ where: { email: 'felipecoes08@gmail.com' } });
      if (targetAdmin && targetAdmin.role !== UserRole.ADMIN) {
        targetAdmin.role = UserRole.ADMIN;
        await this.userRepository.save(targetAdmin);
        console.log(`[UsersService] Usuário felipecoes08@gmail.com garantido com perfil ADMIN.`);
      }

      // 2. Se não houver nenhum admin no banco, promove o primeiro usuário cadastrado
      const adminCount = await this.userRepository.count({ where: { role: UserRole.ADMIN } });
      if (adminCount === 0) {
        const firstUser = await this.userRepository.findOne({ order: { id: 'ASC' } });
        if (firstUser) {
          firstUser.role = UserRole.ADMIN;
          await this.userRepository.save(firstUser);
          console.log(`[UsersService] Usuário #${firstUser.id} (${firstUser.email}) promovido para ADMIN.`);
        }
      }
    } catch (e) {
      // Ignora erro inicial caso tabela ainda esteja sendo sincronizada
    }
  }


  /**
   * Retorna a lista de todos os usuários cadastrados, com contagem de movimentações associadas.
   */
  async findAll(): Promise<SafeUserResponse[]> {
    const users = await this.userRepository.find({
      relations: { movements: true },
      order: { id: 'ASC' },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role || UserRole.USER,
      movementsCount: u.movements?.length ?? 0,
    }));
  }

  /**
   * Cria um novo usuário no banco de dados com a senha protegida por hash Bcrypt.
   * Suporta tanto chamada direta (username, email, password, role) quanto DTO.
   */
  async create(
    usernameOrDto: string | CreateUserDto,
    email?: string,
    passwordPlain?: string,
    role: UserRole = UserRole.USER,
  ): Promise<User> {
    let name: string;
    let userEmail: string;
    let pass: string;
    let userRole: UserRole = role;

    if (typeof usernameOrDto === 'object') {
      name = usernameOrDto.name;
      userEmail = usernameOrDto.email;
      pass = usernameOrDto.password;
      userRole = usernameOrDto.role || UserRole.USER;
    } else {
      name = usernameOrDto;
      userEmail = email!;
      pass = passwordPlain!;
    }

    const normalizedEmail = userEmail.trim().toLowerCase();
    const existing = await this.findOne(normalizedEmail);
    if (existing) {
      throw new ConflictException(`Já existe um usuário com o e-mail '${normalizedEmail}'.`);
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(pass, salt);

    const user = this.userRepository.create({
      name: name.trim(),
      email: normalizedEmail,
      role: userRole,
      passwordHash,
    });

    return await this.userRepository.save(user);
  }

  /**
   * Busca um usuário pelo seu endereço de e-mail (busca case-insensitive).
   *
   * @param email E-mail do usuário
   * @returns Entidade do usuário ou null caso não encontrado
   */
  async findOne(email: string): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { email: email.trim().toLowerCase() },
    });
  }

  /**
   * Busca um usuário pelo ID primário do banco de dados.
   *
   * @param id Identificador do usuário
   * @returns Entidade do usuário ou null caso não encontrado
   */
  async findById(id: number): Promise<User | null> {
    return await this.userRepository.findOne({
      where: { id },
      relations: { movements: true },
    });
  }

  /**
   * Retorna os detalhes de um usuário ou lança exceção 404.
   */
  async findOneById(id: number): Promise<SafeUserResponse> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuário com ID #${id} não foi encontrado.`);
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role || UserRole.USER,
      movementsCount: user.movements?.length ?? 0,
    };
  }

  /**
   * Atualiza as informações, role ou senha de um usuário pelo Administrador.
   *
   * @param id Identificador do usuário a alterar
   * @param dto Campos a atualizar
   */
  async update(id: number, dto: UpdateUserDto): Promise<SafeUserResponse> {
    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuário com ID #${id} não foi encontrado.`);
    }

    if (dto.name) {
      user.name = dto.name.trim();
    }

    if (dto.role) {
      user.role = dto.role;
    }

    if (dto.email) {
      const normalizedEmail = dto.email.trim().toLowerCase();
      if (normalizedEmail !== user.email) {
        const existing = await this.findOne(normalizedEmail);
        if (existing && existing.id !== id) {
          throw new ConflictException(`O e-mail '${normalizedEmail}' já está sendo utilizado por outro usuário.`);
        }
        user.email = normalizedEmail;
      }
    }

    // Se o admin forneceu uma nova senha para o usuário, gera o novo hash
    if (dto.password) {
      const salt = await bcrypt.genSalt(10);
      user.passwordHash = await bcrypt.hash(dto.password, salt);
    }

    const saved = await this.userRepository.save(user);

    return {
      id: saved.id,
      name: saved.name,
      email: saved.email,
      role: saved.role,
      movementsCount: saved.movements?.length ?? 0,
    };
  }

  /**
   * Exclui a conta de um usuário do sistema.
   * Impede a autoexclusão do administrador conectado para manter a integridade do sistema.
   *
   * @param id ID do usuário a excluir
   * @param currentUserId ID do usuário autenticado solicitando a exclusão
   */
  async remove(id: number, currentUserId?: number): Promise<{ message: string }> {
    if (currentUserId && id === currentUserId) {
      throw new BadRequestException('Ação negada: Você não pode excluir sua própria conta de administrador.');
    }

    const user = await this.findById(id);
    if (!user) {
      throw new NotFoundException(`Usuário com ID #${id} não foi encontrado.`);
    }

    await this.userRepository.remove(user);
    return { message: `Usuário '${user.name}' (#${user.id}) excluído com sucesso.` };
  }

  /**
   * Atualiza o hash da senha de um usuário no banco de dados.
   */
  async updatePassword(userId: number, newPasswordHash: string): Promise<void> {
    await this.userRepository.update(userId, {
      passwordHash: newPasswordHash,
    });
  }

  /**
   * Atualiza o endereço de e-mail de um usuário.
   */
  async updateEmail(userId: number, newEmail: string) {
    return this.userRepository.update(userId, { email: newEmail.trim().toLowerCase() });
  }
}