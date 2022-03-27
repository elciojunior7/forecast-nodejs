import { StormGlass, ForecastPoint } from '@src/clients/stormGlass';
import { Beach } from '@src/models/beach';
import { InternalError } from '@src/util/errors/internal-error';

export interface TimeForecast {
  time: string;
  forecast: BeachForecast[];
}

// tipo de erro (exception) especifico
export class ForecastProcessingInternalError extends InternalError {
  constructor(message: string) {
    super(`Unexpected error during the forecast processing: ${message}`);
  }
}

// tipo que concentra as informações do forecast somando
// tanto infos da praia do BD quanto infos resposta da
// API StormGlass. Omit<> remove prop de objeto
// Ex.: Omit<Beach, user> retira prop user da instancia de Beach
export interface BeachForecast extends Omit<Beach, 'user'>, ForecastPoint {}

export class Forecast {
  // passa objeto instanciado para o constructor
  // mas permite sobrescrita caso necessario
  // (como no teste, onde é passado um StormGlass mockado)
  constructor(protected stormGlass = new StormGlass()) {}

  public async processForecastForBeaches(
    beaches: Beach[]
  ): Promise<TimeForecast[]> {
    let pointsWithCorrectSources: BeachForecast[] = [];
    try {
      for (const beach of beaches) {
        const points = await this.stormGlass.fetchPoints(beach.lat, beach.lng);
        const enrichedBeachData = this.enrichBeachData(points, beach);
        //spread para espalhar array enrichedBeachData
        // dentro do array pointsWithCorrectSources sem precisar la
        // rodar laço
        pointsWithCorrectSources.push(...enrichedBeachData);
      }
      return this.mapForecastByTime(pointsWithCorrectSources);
    } catch (err) {
      // "as" aqui funcionando quase como um cast para err passar a ser Error
      throw new ForecastProcessingInternalError((err as Error).message);
    }
  }

  private enrichBeachData(
    points: ForecastPoint[],
    beach: Beach
  ): BeachForecast[] {
    return points.map((e) => ({
      ...{
        lat: beach.lat,
        lng: beach.lng,
        name: beach.name,
        position: beach.position,
        rating: 1, //hardcoded enquanto BD não está on
      },
      ...e,
    }));
  }

  private mapForecastByTime(
    unorderedForecasts: BeachForecast[]
  ): TimeForecast[] {
    const forecastByTime: TimeForecast[] = [];
    for (const point of unorderedForecasts) {
      const timePoint = forecastByTime.find((f) => f.time === point.time);
      // se existe algum timePoint, então ja foi encontrada a data/hora em questão
      // em alguma das iterações anteriores do for pela lista...
      if (timePoint) {
        // ...então deve-se adicionar o point
        // na mesma sublista(forecast) daquela data/hora
        timePoint.forecast.push(point);
      } else {
        // ...senao, é a primeira vez que aparece a data/hora
        // entao deve-se adicionar um novo objeto com time e
        // criada um lista de forecast para aquela data/hora (time)
        // lista esta que começa com o point da iteração atual
        forecastByTime.push({
          time: point.time,
          forecast: [point],
        });
      }
    }
    return forecastByTime;
  }
}
