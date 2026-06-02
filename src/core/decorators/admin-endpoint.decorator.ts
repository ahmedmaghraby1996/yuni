import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiExtension } from '@nestjs/swagger';

export const AdminEndpoint = () => applyDecorators(ApiExtension('x-admin', true), ApiBearerAuth());
