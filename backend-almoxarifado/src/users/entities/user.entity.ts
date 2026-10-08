import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Movement } from '../../movements/entities/movement.entity.js';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  name: string;

  @Column()
  passwordHash: string;

  @OneToMany(() => Movement, (movement) => movement.user)
  movements: Movement[];
}