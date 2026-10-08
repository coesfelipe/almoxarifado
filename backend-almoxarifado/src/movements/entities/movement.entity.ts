import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import type { User } from '../../users/entities/user.entity.js';
import type { Product } from '../../products/entities/product.entity.js';

export enum MovementType {
  ENTRY = 'ENTRY',
  EXIT = 'EXIT',
}

@Entity('movements')
export class Movement {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({
    type: 'text',
    enum: MovementType,
    default: MovementType.ENTRY,
  })
  type: MovementType;

  @Column({ type: 'int' })
  quantity: number;

  @Column({ type: 'text', nullable: true })
  requester?: string;

  //Nessa entity, vai ser o local onde vai armazenar o LINK dos PDFs das NOTAS FISCAIS.
  @Column({ type: 'text', nullable: true })
  description?: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne('User', (user: User) => user.movements, { onDelete: 'CASCADE' })
  user: User;

  @ManyToOne('Product', (product: Product) => product.movements, { onDelete: 'CASCADE' })
  product: Product;
}