import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module.js';

/**
 * Função de inicialização (bootstrap) da API NestJS do Almoxarifado.
 * Configura pipes globais de validação e sanitização, políticas de CORS
 * e inicia a escuta na porta configurada.
 */
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Habilita validação e transformação global com class-validator e class-transformer
  // - whitelist: descarta propriedades que não estejam explicitamente declaradas nos DTOs
  // - transform: converte tipos primitivos automaticamente (ex: strings numéricas para number)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  // Configuração de Cross-Origin Resource Sharing (CORS) para comunicação segura com o frontend Angular
  app.enableCors({
    origin: ['http://localhost:4200', 'http://127.0.0.1:4200'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  console.log(`[Almoxarifado API] Servidor iniciado com sucesso em http://localhost:${port}`);
}

await bootstrap();

