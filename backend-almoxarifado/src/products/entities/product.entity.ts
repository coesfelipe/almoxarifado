import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Movement } from '../../movements/entities/movement.entity.js';
import type { User } from '../../users/entities/user.entity.js';

/**
 * Entidade de Produto (Item de Estoque do Almoxarifado).
 * Representa os materiais, equipamentos e insumos gerenciados no estoque,
 * incluindo seu saldo atual, valor unitário de referência, usuário responsável pelo cadastro
 * e histórico de movimentações.
 */
@Entity('products')
export class Product {
  /**
   * Identificador único do produto no sistema (chave primária).
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Descrição ou nome do produto (ex: 'Resma de Papel A4', 'Teclado USB').
   */
  @Column()
  name: string;

  /**
   * Valor unitário atual do item em reais (R$).
   * Armazenado como decimal com precisão 10 e escala 2 para garantir exatidão financeira.
   */
  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  /**
   * Unidade de medida padrão para controle do item (ex: 'UN', 'CX', 'KG', 'L', 'PCT').
   * Valor padrão: 'UN' (Unidade).
   */
  @Column({ default: 'UN' })
  measurement: string;

  /**
   * Categoria mercadológica ou grupo do produto (ex: 'Informática', 'Material de Escritório').
   */
  @Column({ nullable: true })
  category: string;

  /**
   * Saldo atual físico disponível no almoxarifado.
   * Atualizado de forma transacional e atômica a cada entrada ou saída.
   */
  @Column({ type: 'int', default: 0 })
  currentStock: number;

  /**
   * Data e hora do cadastro inicial do produto no sistema.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Identificador do usuário que realizou o cadastro inicial do produto.
   */
  @Column({ nullable: true })
  userId?: number;

  /**
   * Relação com o usuário responsável pelo cadastro do produto.
   */
  @ManyToOne('User', (user: User) => user.products, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'userId' })
  user?: User;

  /**
   * Coleção de todas as movimentações de entrada e saída vinculadas a este produto.
   */
  @OneToMany('Movement', (movement: Movement) => movement.product)
  movements: Movement[];
}