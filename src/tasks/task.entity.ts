// src/tasks/task.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from "typeorm";
import { User } from '@/users/user.entity';
import { IsIn } from "class-validator";

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  description: string;

  // Fixed typo + proper TypeORM enum usage
  @Column({
    type: 'enum',
    enum: ['OPEN', 'IN_PROGRESS', 'DONE'],
    default: 'OPEN',
  })
  @IsIn(['OPEN', 'IN_PROGRESS', 'DONE'])
  status: 'OPEN' | 'IN_PROGRESS' | 'DONE';

  @ManyToOne(() => User, user => user.tasks, { onDelete: 'CASCADE' })
  user: User;

  @Column('uuid')
  userId: string;
}