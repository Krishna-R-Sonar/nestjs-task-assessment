// src/tasks/dto/update-task.dto.ts
import { PartialType } from "@nestjs/mapped-types";
import { CreateTaskDto } from "./create-task.dto";
import { IsOptional, IsIn } from "class-validator";

export class UpdateTaskDto extends PartialType(CreateTaskDto) {
  @IsOptional()
  @IsIn(['OPEN', 'IN_PROGRESS', 'DONE'])
  status?: 'OPEN' | 'IN_PROGRESS' | 'DONE';
}