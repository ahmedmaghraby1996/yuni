import { Expose } from 'class-transformer';
import {
    Entity,
    PrimaryGeneratedColumn,
    BaseEntity as TypeORMBaseEntity,
} from 'typeorm';

@Entity()
export abstract class BaseEntity extends TypeORMBaseEntity {
    @PrimaryGeneratedColumn('uuid')
    @Expose()
    id!: string;
}