import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { ValidationPipe } from './_shared/validation.pipe';

(async () => {
  const app = await NestFactory.create(AppModule, { cors: true });

  app.useGlobalPipes(new ValidationPipe());
  await app.listen(process.env.PORT || 3000);

  Logger.log(`Server running on port ${process.env.PORT || 3000}`);
})();
