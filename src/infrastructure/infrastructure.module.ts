import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm/dist';
import { DB_ENTITIES } from './context/database.context';
import { AdminSeedService } from './presistance/seeders/admin-seed.service';

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature(DB_ENTITIES)
    ],
    providers: [AdminSeedService],
    exports: [TypeOrmModule]
})
export class InfrastructureModule { }
