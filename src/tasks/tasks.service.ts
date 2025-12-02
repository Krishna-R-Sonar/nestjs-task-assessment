// src/tasks/tasks.service.ts
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Task } from './task.entity';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private tasksRepo: Repository<Task>,
  ) {}

  create(dto: CreateTaskDto, userId: string) {
    const task = this.tasksRepo.create({ ...dto, userId });
    return this.tasksRepo.save(task);
  }

  findAll(userId: string) {
    return this.tasksRepo.find({ where: { userId } });
  }

  async findOne(id: string, userId: string) {
    const task = await this.tasksRepo.findOne({ where: { id, userId } });
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async update(id: string, dto: UpdateTaskDto, userId: string) {
    const task = await this.findOne(id, userId);
    Object.assign(task, dto);
    return this.tasksRepo.save(task);
  }

  async remove(id: string, userId: string) {
    const task = await this.findOne(id, userId);
    await this.tasksRepo.delete(id);
    return { message: 'Task deleted successfully' };
  }
}