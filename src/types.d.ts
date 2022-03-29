import * as http from 'http';
import { DecodedUser } from './services/auth';

// estrategia de module argmentation
// sobrescrita do Módulo Request inteiro, estendendo tudo o que ele já terminar
// e adicionando o atributo decoded
declare module 'express-serve-static-core' {
  export interface Request extends http.IncomingMessage, Express.Request {
    decoded?: DecodedUser;
  }
}
