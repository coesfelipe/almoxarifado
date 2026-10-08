import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Movement } from '../../movements/entities/movement.entity.js';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column('decimal', { precision: 10, scale: 2 })
  price: number;

  @Column({ default: 'UN' })
  measurement: string;

  @Column({ nullable: true })
  category: string;

  @Column({ type: 'int', default: 0 })
  currentStock: number;

  @OneToMany('Movement', (movement: Movement) => movement.product)
  movements: Movement[];
}