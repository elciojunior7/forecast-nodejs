import { InternalError } from '@src/util/errors/internal-error';
import * as HTTPUtil from '@src/util/request';
import { TimeUtil } from '@src/util/time';
import config, { IConfig } from 'config';

//cada chave:valor do objeto desnormalizado da API
//ex.: "swellDirection": {"noaa": 64.26}
export interface StormGlassPointSource {
  //estratégia de chave dinâmica, poderia ser "noaa": number
  [key: string]: number;
}

//cada objeto desnormalizado recuperado da API
export interface StormGlassPoint {
  time: string;
  readonly waveHeight: StormGlassPointSource;
  readonly waveDirection: StormGlassPointSource;
  readonly swellDirection: StormGlassPointSource;
  readonly swellHeight: StormGlassPointSource;
  readonly swellPeriod: StormGlassPointSource;
  readonly windDirection: StormGlassPointSource;
  readonly windSpeed: StormGlassPointSource;
}

//lista desnormalizada recuperada da API
export interface StormGlassForecastResponse {
  hours: StormGlassPoint[];
}

//cada objeto normalizado a partir do desnormalizado vindo da API
export interface ForecastPoint {
  time: string;
  waveHeight: number;
  waveDirection: number;
  swellDirection: number;
  swellHeight: number;
  swellPeriod: number;
  windDirection: number;
  windSpeed: number;
}

/**
 * This error type is used when a request reaches out to the StormGlass API but returns an error
 */
export class StormGlassUnexpectedResponseError extends InternalError {
  constructor(message: string) {
    super(message);
  }
}

/**
 * This error type is used when something breaks before the request reaches out to the StormGlass API
 * eg: Network error, or request validation error
 */
export class ClientRequestError extends InternalError {
  constructor(message: string) {
    const internalMessage =
      'Unexpected error when trying to communicate to StormGlass';
    super(`${internalMessage}: ${message}`);
  }
}

export class StormGlassResponseError extends InternalError {
  constructor(message: string) {
    const internalMessage =
      'Unexpected error returned by the StormGlass service';
    super(`${internalMessage}: ${message}`);
  }
}

/**
 * We could have proper type for the configuration
 */
const stormglassResourceConfig: IConfig = config.get(
  'App.resources.StormGlass'
);

export class StormGlass {
  readonly stormGlassAPIParams =
    'swellDirection,swellHeight,swellPeriod,waveDirection,waveHeight,windDirection,windSpeed';
  readonly stormGlassAPISource = 'noaa';
  constructor(protected request = new HTTPUtil.Request()) {}

  public async fetchPoints(lat: number, lng: number): Promise<ForecastPoint[]> {
    const endTimestamp = TimeUtil.getUnixTimeForAFutureDay(1);
    try {
      const response = await this.request.get<StormGlassForecastResponse>(
        `${stormglassResourceConfig.get('apiUrl')}/weather/point?params=${
          this.stormGlassAPIParams
        }&source=${
          this.stormGlassAPISource
        }&end=${endTimestamp}&lat=${lat}&lng=${lng}`,
        {
          headers: {
            Authorization: stormglassResourceConfig.get('apiToken'),
          },
        }
      );
      return this.normalizeResponse(response.data);
    } catch (err) {
      if (err instanceof Error && HTTPUtil.Request.isRequestError(err)) {
        const error = HTTPUtil.Request.extractErrorData(err);
        throw new StormGlassResponseError(
          `Error: ${JSON.stringify(error.data)} Code: ${error.status}`
        );
      }
      /**
       * All the other errors will fallback to a generic client error
       */
      throw new ClientRequestError(JSON.stringify(err));
    }
  }

  // realiza o de/para visando normalização
  // Ex.: DE waveHeight{"noaa": 64.26} PARA waveHeight: 64.26
  private normalizeResponse(
    points: StormGlassForecastResponse
  ): ForecastPoint[] {
    //se faz bind de this porque isValidPoint estaria undefined neste momento
    return points.hours.filter(this.isValidPoint.bind(this)).map((point) => ({
      swellDirection: point.swellDirection[this.stormGlassAPISource],
      swellHeight: point.swellHeight[this.stormGlassAPISource],
      swellPeriod: point.swellPeriod[this.stormGlassAPISource],
      time: point.time,
      waveDirection: point.waveDirection[this.stormGlassAPISource],
      waveHeight: point.waveHeight[this.stormGlassAPISource],
      windDirection: point.windDirection[this.stormGlassAPISource],
      windSpeed: point.windSpeed[this.stormGlassAPISource],
    }));
  }

  // método que verifica se todas propriedades do payload vindo da API,
  // não são vazios e estão no formato esperado. Ex.: waveHeight{"noaa": 64.26}
  private isValidPoint(point: Partial<StormGlassPoint>): boolean {
    return !!(
      //dupla exclamação para forçar boolean evitando undefined
      (
        point.time &&
        point.swellDirection?.[this.stormGlassAPISource] &&
        point.swellHeight?.[this.stormGlassAPISource] &&
        point.swellPeriod?.[this.stormGlassAPISource] &&
        point.waveDirection?.[this.stormGlassAPISource] &&
        point.waveHeight?.[this.stormGlassAPISource] &&
        point.windDirection?.[this.stormGlassAPISource] &&
        point.windSpeed?.[this.stormGlassAPISource]
      )
    );
  }
}
