import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Movement } from '../../movements/entities/movement.entity.js';
import type { Product } from '../../products/entities/product.entity.js';

/**
 * Níveis de permissão (Roles) de usuários no sistema:
 * - ADMIN: Administrador com acesso completo a gestão de contas (criar, editar, excluir usuários),
 *   relatórios e parametrizações gerais do almoxarifado.
 * - USER: Operador padrão do almoxarifado com permissões operacionais (movimentações, consulta e produtos).
 */
export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

/**
 * Entidade de Usuário do Sistema.
 * Representa os operadores e administradores que acessam o sistema de almoxarifado,
 * realizam login, cadastram produtos e efetuam movimentações com registro de auditoria.
 */
@Entity('users')
export class User {
  /**
   * Identificador único do usuário no sistema (chave primária).
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Endereço de e-mail institucional único para autenticação.
   */
  @Column({ unique: true })
  email: string;

  /**
   * Nome completo ou nome de exibição do usuário.
   */
  @Column()
  name: string;

  /**
   * Papel/Nível de permissão do usuário no sistema (ADMIN ou USER).
   * Valor padrão para novos usuários: 'USER'.
   */
  @Column({
    type: 'text',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  /**
   * Hash criptográfico seguro da senha gerado via Bcrypt.
   * A senha em texto claro nunca é armazenada no banco de dados.
   */
  @Column()
  passwordHash: string;

  /**
   * Coleção de movimentações registradas por este usuário.
   */
  @OneToMany(() => Movement, (movement) => movement.user)
  movements: Movement[];

  /**
   * Coleção de produtos do estoque cadastrados por este usuário.
   */
  @OneToMany('Product', (product: Product) => product.user)
  products: Product[];
}