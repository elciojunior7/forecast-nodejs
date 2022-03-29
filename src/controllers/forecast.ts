import {
  ClassMiddleware,
  Controller,
  Get,
  Middleware,
} from '@overnightjs/core';
import logger from '@src/logger';
import { authMiddleware } from '@src/middlewares/auth';
import { Beach } from '@src/models/beach';
import { Forecast } from '@src/services/forecast';
import ApiError from '@src/util/errors/api-error';
import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import { BaseController } from '.';

const forecast = new Forecast();

const rateLimiter = rateLimit({
  //limitar qtde de requests por hora por ip
  windowMs: 60 * 60 * 1000,
  max: 1,
  keyGenerator(req: Request): string {
    return req.ip;
  },
  //sem handler, quando limite for atingido, msg devolvida será despadronizada
  handler(_, res: Response): void {
    res.status(429).send(
      ApiError.format({
        code: 429,
        message: 'Too many request to the /forecast endpoint',
      })
    );
  },
});

@Controller('forecast') //padrão da URL da rota para este controller
@ClassMiddleware(authMiddleware)
export class ForecastController extends BaseController {
  @Get('') //verbo get com string vazia, então rota será "forecast/"
  @Middleware(rateLimiter)
  public async getForecastForgeLoggedUser(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const beaches = await Beach.find({ user: req.decoded?.id });
      const forecastData = await forecast.processForecastForBeaches(beaches);
      res.status(200).send(forecastData);
    } catch (error) {
      // disparar 500 em casos de exceção, pois, trata-se
      // de um erro interno, usuário jamais terá culpa do erro que
      // pode ocorrer aqui visto que ou será um erro no select do banco
      // ou na requisição à API externa do StormGlass
      logger.error(error);
      this.sendErrorResponse(res, {
        code: 500,
        message: 'Something went wrong',
      });
    }
  }
}
