import { ClassMiddleware, Controller, Post } from '@overnightjs/core';
import { authMiddleware } from '@src/middlewares/auth';
import { Beach } from '@src/models/beach';
import { Request, Response } from 'express';
import { BaseController } from '.';

@Controller('beaches')
@ClassMiddleware(authMiddleware)
export class BeachesController extends BaseController {
// decorator com verbo post do overnight
  @Post('')
  public async create(req: Request, res: Response): Promise<void> {
    try{
        const beach = new Beach({ ...req.body, ...{ user: req.decoded?.id } });;
        const result = await beach.save();
        res.status(201).send(result);
    }catch(error){
      // se for um erro de validação, por exemplo
      // o schema de Beach tem latitude estipulado como number
      // e um dos objetos a ser adicionados/persistidos no MongoDB
      // tem a propriedade "lat" com valor do tipo string
      this.sendCreateUpdateErrorResponse(res, error);
    }
  }
}