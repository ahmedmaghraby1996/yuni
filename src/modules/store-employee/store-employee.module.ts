import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StoreEmployee } from 'src/infrastructure/entities/store/store-employee.entity';
import { StoreEmployeeRole } from 'src/infrastructure/entities/store/store-employee-role.entity';
import { User } from 'src/infrastructure/entities/user/user.entity';
import { Subscription } from 'src/infrastructure/entities/subscription/subscription.entity';
import { Package } from 'src/infrastructure/entities/package/package.entity';
import { StoreEmployeeController } from './store-employee.controller';
import { StoreEmployeeService } from './store-employee.service';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([StoreEmployee, StoreEmployeeRole, User, Subscription, Package])],
  controllers: [StoreEmployeeController],
  providers: [StoreEmployeeService],
  exports: [StoreEmployeeService],
})
export class StoreEmployeeModule {}
