import { Request, Response, NextFunction } from 'express';
import AuthService from '@src/services/auth';

export function authMiddleware(
  // Type/tipo Partial torna todos os parametros/campos do Request, Response serem opcionais
  // o que faz que qualquer Request ou Response passado como param para o authMiddleware
  // dê erro porque vários campos obrigatórios do request estão vazios
  req: Partial<Request>,
  res: Partial<Response>,
  next: NextFunction
): void {
  const token = req.headers?.['x-access-token'];
  try {
    const decoded = AuthService.decodeToken(token as string);
    req.decoded = decoded;
    next();
  } catch (err) {
    if(err instanceof Error) {
      res.status?.(401).send({ code: 401, error: err.message });
    } else {
      res.status?.(401).send({ code: 401, error: 'Unknown auth error' });
    }
  }
}