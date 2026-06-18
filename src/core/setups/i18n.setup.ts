import {
  AcceptLanguageResolver,
  I18nJsonLoader,
  I18nModule,
  QueryResolver,
} from 'nestjs-i18n';
import { existsSync } from 'fs';
import { join } from 'path';

function resolveI18nPath(): string {
  const distPath = join(process.cwd(), 'dist', 'i18n');
  const srcPath = join(process.cwd(), 'src', 'i18n');

  if (existsSync(distPath)) {
    return distPath;
  }

  return srcPath;
}

export default () => (
  I18nModule.forRoot({
    fallbackLanguage: 'en',
    loader: I18nJsonLoader,
    loaderOptions: {
      path: resolveI18nPath(),
      watch: true,
    },
    resolvers: [
      { use: QueryResolver, options: ['lang'] },
      AcceptLanguageResolver,
    ],
  })
);
