import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import type { User } from '../../users/entities/user.entity.js';
import type { Product } from '../../products/entities/product.entity.js';

/**
 * Enumeração que define a direção do fluxo de estoque.
 * ENTRY: Entrada de mercadorias no almoxarifado (compras, doações, devoluções).
 * EXIT: Saída de mercadorias do almoxarifado (requisições de setores, baixas, descartes).
 */
export enum MovementType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
}

/**
 * Entidade de Movimentação de Estoque (Auditoria e Controle Contábil).
 * Registra cada transação física e financeira realizada no almoxarifado,
 * garantindo rastreabilidade do usuário responsável, produto, quantidade,
 * valor unitário do item no instante da operação e valor total transacionado.
 */
@Entity('movements')
export class Movement {
  /**
   * Identificador único da movimentação gerado automaticamente pelo banco de dados.
   */
  @PrimaryGeneratedColumn()
  id: number;

  /**
   * Tipo da movimentação (ENTRY = Entrada, EXIT = Saída).
   */
  @Column({
    type: 'text',
    enum: MovementType,
    default: MovementType.ENTRY,
  })
  type: MovementType;

  /**
   * Quantidade de itens movimentados nesta operação (sempre inteiro positivo).
   */
  @Column({ type: 'int' })
  quantity: number;

  /**
   * Valor unitário do produto no instante exato da movimentação.
   * Importante: Preserva o histórico financeiro e contábil, de modo que futuras
   * alterações no preço de cadastro do produto não afetem relatórios de movimentações passadas.
   */
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  unitPrice?: number;

  /**
   * Valor total desta movimentação (calculado por: quantity * unitPrice).
   * Permite consultas analíticas e somatórios de relatórios de forma performática.
   */
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  totalPrice?: number;

  /**
   * Setor institucional de destino para saídas de materiais.
   * Exemplo: 'Elétrica', 'Manutenção', 'Audiovisual', etc.
   */
  @Column({ type: 'text', nullable: true })
  sector?: string;

  /**
   * Identificação da pessoa, departamento ou setor solicitante da movimentação.
   * Exemplo: 'Departamento de TI', 'Setor de Manutenção', 'João da Silva'.
   */
  @Column({ type: 'text', nullable: true })
  requester?: string;

  /**
   * Detalhes adicionais, justificativas, observações ou link para documento fiscal/comprovante.
   */
  @Column({ type: 'text', nullable: true })
  description?: string;

  /**
   * Data e hora exatas do registro da movimentação no sistema.
   */
  @CreateDateColumn()
  createdAt: Date;

  /**
   * Chave estrangeira explícita para o usuário que executou a operação.
   */
  @Column({ nullable: true })
  userId?: number;

  /**
   * Chave estrangeira explícita para o produto associado a esta movimentação.
   */
  @Column({ nullable: true })
  productId?: number;

  /**
   * Relação com a entidade de Usuário que operou o sistema.
   * Exclui as movimentações se o usuário for deletado em cascata.
   */
  @ManyToOne('User', (user: User) => user.movements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  /**
   * Relação com a entidade de Produto que teve seu estoque alterado.
   * Exclui as movimentações se o produto for deletado em cascata.
   */
  @ManyToOne('Product', (product: Product) => product.movements, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'productId' })
  product: Product;
}