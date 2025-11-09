import { BaseEntity } from "src/infrastructure/base/base.entity";
import { SystemVariableEnum } from "src/infrastructure/data/enums/sysytem-variable.enum";
import { Column, Entity } from "typeorm";

@Entity('system_variables')
export class SystemVariable  extends BaseEntity{
@Column({ type: 'enum', enum: SystemVariableEnum })
key: SystemVariableEnum;
@Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
value: number;

}