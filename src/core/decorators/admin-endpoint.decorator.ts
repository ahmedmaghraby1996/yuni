import { applyDecorators } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

export const AdminEndpoint = () => applyDecorators(ApiTags('Admin'), ApiBearerAuth());
