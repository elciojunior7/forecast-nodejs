import { SetupServer } from '@src/server';
import supertest from 'supertest';

let server: SetupServer;
beforeAll(async () => {
  server = new SetupServer();
  await server.init();
  // supertest usado, entre outros motivos, para fazer 
  // requisição HTTP aos controllers p/ testes de integração
  // sem precisar de servidor rodando
  global.testRequest = supertest(server.getApp());
});

afterAll(async () => await server.close());