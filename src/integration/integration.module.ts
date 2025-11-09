import { Global, Module } from '@nestjs/common';
import { GatewaysModule } from './gateways/gateways.module';
import { ImageManager } from './sharp/image.manager';
import { StorageManager } from './storage/storage.manager';
import { NotifyModule } from './notify/notify.module';

@Global()
@Module({
    imports: [
        NotifyModule,
        GatewaysModule, // *Socket.io
    ],
    providers: [
        StorageManager,
        ImageManager,
    ],
    exports: [
        StorageManager,
        ImageManager,
        NotifyModule
    ]
})
export class IntegrationModule { }
