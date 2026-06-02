import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

import { AuthenticationModule } from 'src/modules/authentication/authentication.module';
import { BanarModule } from 'src/modules/banar/banar.module';
import { CategoryModule } from 'src/modules/category/category.module';
import { ChatModule } from 'src/modules/chat/chat.module';
import { ContactUsModule } from 'src/modules/contact-us/contact-us.module';
import { FaqModule } from 'src/modules/faq/faq.module';
import { FileModule } from 'src/modules/file/file.module';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { OffersModule } from 'src/modules/offers/offers.module';
import { PackagesModule } from 'src/modules/packages/packages.module';
import { SendEmailModule } from 'src/modules/send-email/send-email.module';
import { StaticPageModule } from 'src/modules/static-page/static-page.module';
import { SuggestionsComplaintsModule } from 'src/modules/suggestions-complaints/suggestions-complaints.module';

import { TransactionModule } from 'src/modules/transaction/transaction.module';
import { UserModule } from 'src/modules/user/user.module';

function filterByAdminTag(document: OpenAPIObject): OpenAPIObject {
  const filteredPaths: Record<string, any> = {};
  for (const [path, pathItem] of Object.entries(document.paths || {})) {
    const filteredMethods: Record<string, any> = {};
    for (const [method, operation] of Object.entries(pathItem as Record<string, any>)) {
      if (operation && typeof operation === 'object' && Array.isArray(operation.tags) && operation.tags.includes('Admin')) {
        filteredMethods[method] = {
          ...operation,
          tags: operation.tags.filter((t: string) => t !== 'Admin'),
        };
      }
    }
    if (Object.keys(filteredMethods).length > 0) {
      filteredPaths[path] = filteredMethods;
    }
  }
  return { ...document, paths: filteredPaths };
}

function filterOutAdminTag(document: OpenAPIObject): OpenAPIObject {
  const filteredPaths: Record<string, any> = {};
  for (const [path, pathItem] of Object.entries(document.paths || {})) {
    const filteredMethods: Record<string, any> = {};
    for (const [method, operation] of Object.entries(pathItem as Record<string, any>)) {
      const hasAdminTag = operation && typeof operation === 'object' && Array.isArray(operation.tags) && operation.tags.includes('Admin');
      if (!hasAdminTag) {
        filteredMethods[method] = operation;
      }
    }
    if (Object.keys(filteredMethods).length > 0) {
      filteredPaths[path] = filteredMethods;
    }
  }
  return { ...document, paths: filteredPaths };
}

export default (app: INestApplication, config: ConfigService) => {
  const operationIdFactory = (_controllerKey: string, methodKey: string) =>
    methodKey;

  const baseConfig = new DocumentBuilder()
    .addBearerAuth()
    .setTitle(`${config.get('APP_NAME')} API`)
    .setDescription(`${config.get('APP_NAME')} API description`)
    .setVersion('v1')
    .setContact(
      'Contact',
      'https://github.com/mahkassem',
      'mahmoud.ali.kassem@gmail.com',
    )
    .setLicense(
      'Developed by Ahmed el-Maghraby',
      'https://github.com/mahkassem',
    )
    .addServer(config.get('APP_HOST'))
    .build();

  const fullDocument = SwaggerModule.createDocument(app, baseConfig, {
    include: [
      AuthenticationModule,
      UserModule,
      SuggestionsComplaintsModule,
      StaticPageModule,
      ContactUsModule,
      FaqModule,
      NotificationModule,
      SendEmailModule,
      OffersModule,
      FileModule,
      BanarModule,
      ChatModule,
      PackagesModule,
      CategoryModule,
      TransactionModule,
    ],
    operationIdFactory,
  });

  const publicDocument = filterOutAdminTag(fullDocument);
  const adminDocument = filterByAdminTag(fullDocument);

  SwaggerModule.setup('swagger', app, publicDocument);
  SwaggerModule.setup('swagger/admin', app, adminDocument, {
    swaggerOptions: { persistAuthorization: true },
  });
};
