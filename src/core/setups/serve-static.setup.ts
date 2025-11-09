import { join } from "path";
import { ServeStaticModule } from "@nestjs/serve-static";

export default () => (
  ServeStaticModule.forRoot({
    serveRoot: "/",
    rootPath: join(__dirname, '..', '..', '..', 'public'),
    exclude: ['/api*', '/v1*'],
    
  })
);