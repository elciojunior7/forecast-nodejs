import { ClassMiddleware, Controller, Get } from '@overnightjs/core';
import { authMiddleware } from '@src/middlewares/auth';
import { Beach } from '@src/models/beach';
import { Forecast } from '@src/services/forecast';
import { Request, Response } from 'express';

const forecast = new Forecast();

@Controller('forecast') //padrão da URL da rota para este controller
@ClassMiddleware(authMiddleware)
export class ForecastController {
  @Get('') //verbo get com string vazia, então rota será "forecast/"
  public async getForecastForgeLoggedUser(req: Request, res: Response): Promise<void>{
    try {
      const beaches = await Beach.find({user: req.decoded?.id});
      const forecastData = await forecast.processForecastForBeaches(beaches);
      res.status(200).send(forecastData);
    } catch (error) {
      // disparar 500 em casos de exceção, pois, trata-se
      // de um erro interno, usuário jamais terá culpa do erro que
      // pode ocorrer aqui visto que ou será um erro no select do banco
      // ou na requisição à API externa do StormGlass
      res.status(500).send({ error: 'Something went wrong' });
    }
  }
}
