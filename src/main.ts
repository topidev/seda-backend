import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import cookieParser from 'cookie-parser';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.use((req, res, next) => {
  //   console.log('Incoming headers:', req.headers);
  //   console.log('Cookie header:', req.headers.cookie);
  //   next();
  // });
  app.use(cookieParser())
  app.enableCors({
    origin: [process.env.FRONTEND_URL, 'http://localhost:3001'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true
    })
  )
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
