import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiExtension } from '@nestjs/swagger';

export const StoreEndpoint = () => applyDecorators(ApiExtension('x-store', true), ApiBearerAuth());
