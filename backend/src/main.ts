import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
console.log('CWD =', process.cwd());
console.log('DB_PASSWORD =', process.env.DB_PASSWORD);

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}

bootstrap();
