import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminEmployee } from 'src/infrastructure/entities/admin/admin-employee.entity';
import { AdminEmployeeRole } from 'src/infrastructure/entities/admin/admin-employee-role.entity';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { ImageManager } from 'src/integration/sharp/image.manager';
import { StorageManager } from 'src/integration/storage/storage.manager';
import { AdminEmployeeController } from './admin-employee.controller';
import { AdminEmployeeService } from './admin-employee.service';

@Module({
  imports: [TypeOrmModule.forFeature([AdminEmployee, AdminEmployeeRole, User])],
  controllers: [AdminEmployeeController],
  providers: [AdminEmployeeService, ImageManager, StorageManager],
})
export class AdminEmployeeModule {}
