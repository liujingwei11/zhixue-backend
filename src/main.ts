import 'reflect-metadata';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  app.enableCors({ origin: true, credentials: true });
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  // 静态前端页面托管，web文件夹 和 src同级
  app.useStaticAssets(join(__dirname, '../web'));

  const swaggerConfig = new DocumentBuilder()
    .setTitle('智学云 Online Learning Platform API')
    .setDescription('WLearn智学 API: authentication, course catalog, enrollment and progress tracking')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
  console.log('WLearn智学后端已启动: http://localhost:' + port + '/api');
  console.log('Swagger 文档: http://localhost:' + port + '/docs');
}
bootstrap();
