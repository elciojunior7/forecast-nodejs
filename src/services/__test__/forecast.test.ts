import { StormGlass } from '@src/clients/stormGlass';
import { Beach, GeoPosition } from '@src/models/beach';
import stormGlassNormalizedResponseFixture from '@test/fixtures/stormglass_normalized_response_3_hours.json';
import { Forecast, ForecastProcessingInternalError } from '../forecast';

//mock do arquivo stormClass.ts
jest.mock('@src/clients/stormGlass');

describe('Forecast Service', () => {
  // para uso de mock otimizado para entender autocomplete e tipos
  // ja que a const mockedStormGlassService contem estados e ações
  // tanto do StormGlass quanto do Jest
  const mockedStormGlassService = new StormGlass() as jest.Mocked<StormGlass>;

  it('should return the forecast for mutiple beaches in the same hour with different ratings', async () => {
    mockedStormGlassService.fetchPoints.mockResolvedValueOnce([
      {
        swellDirection: 123.41,
        swellHeight: 0.21,
        swellPeriod: 3.67,
        time: '2020-04-26T00:00:00+00:00',
        waveDirection: 232.12,
        waveHeight: 0.46,
        windDirection: 310.48,
        windSpeed: 100,
      },
    ]);
    mockedStormGlassService.fetchPoints.mockResolvedValueOnce([
      {
        swellDirection: 64.26,
        swellHeight: 0.15,
        swellPeriod: 13.89,
        time: '2020-04-26T00:00:00+00:00',
        waveDirection: 231.38,
        waveHeight: 2.07,
        windDirection: 299.45,
        windSpeed: 100,
      },
    ]);

    const beaches: Beach[] = [
      {
        lat: -33.792726,
        lng: 151.289824,
        name: 'Manly',
        position: GeoPosition.E,
        user: 'fake-id',
      },
      {
        lat: -33.792726,
        lng: 141.289824,
        name: 'Dee Why',
        position: GeoPosition.S,
        user: 'fake-id',
      },
    ];
    const expectedResponse = [
      {
        time: '2020-04-26T00:00:00+00:00',
        forecast: [
          {
            lat: -33.792726,
            lng: 141.289824,
            name: 'Dee Why',
            position: 'S',
            rating: 3,
            swellDirection: 64.26,
            swellHeight: 0.15,
            swellPeriod: 13.89,
            time: '2020-04-26T00:00:00+00:00',
            waveDirection: 231.38,
            waveHeight: 2.07,
            windDirection: 299.45,
            windSpeed: 100,
          },
          {
            lat: -33.792726,
            lng: 151.289824,
            name: 'Manly',
            position: 'E',
            rating: 2,
            swellDirection: 123.41,
            swellHeight: 0.21,
            swellPeriod: 3.67,
            time: '2020-04-26T00:00:00+00:00',
            waveDirection: 232.12,
            waveHeight: 0.46,
            windDirection: 310.48,
            windSpeed: 100,
          },
        ],
      },
    ];
    const forecast = new Forecast(mockedStormGlassService);
    const beachesWithRating = await forecast.processForecastForBeaches(beaches);
    expect(beachesWithRating).toEqual(expectedResponse);
  });

  it('should return the forecast for a list of beaches', async () => {
    // exemplo de mock a partir do prototype (pois fetchPoints precisa de instancia de StormGlass para ser usado)
    // não é o ideal porque se está sobrescrevendo a função com outra
    // o que impede autocomplete a partir do fetchPoints
    // StormGlass.prototype.fetchPoints = jest
    //   .fn()
    //   .mockResolvedValue(stormGlassNormalizedResponseFixture);

    mockedStormGlassService.fetchPoints.mockResolvedValue(
      stormGlassNormalizedResponseFixture
    );

    //hardcoded de uma praia que estaria no BD
    const beaches = [
      {
        lat: -33.792726,
        lng: 151.289824,
        name: 'Manly',
        position: GeoPosition.E,
        user: 'some-id',
      },
    ];
    // exemplo de payload montado pelo service Forecast juntando dados
    // da praia do BD com infos recuperadas da API StormGlass
    const expectedResponse = [
      {
        time: '2020-04-26T00:00:00+00:00',
        forecast: [
          {
            lat: -33.792726,
            lng: 151.289824,
            name: 'Manly',
            position: 'E',
            rating: 2,
            swellDirection: 64.26,
            swellHeight: 0.15,
            swellPeriod: 3.89,
            time: '2020-04-26T00:00:00+00:00',
            waveDirection: 231.38,
            waveHeight: 0.47,
            windDirection: 299.45,
            windSpeed: 100,
          },
        ],
      },
      {
        time: '2020-04-26T01:00:00+00:00',
        forecast: [
          {
            lat: -33.792726,
            lng: 151.289824,
            name: 'Manly',
            position: 'E',
            rating: 2,
            swellDirection: 123.41,
            swellHeight: 0.21,
            swellPeriod: 3.67,
            time: '2020-04-26T01:00:00+00:00',
            waveDirection: 232.12,
            waveHeight: 0.46,
            windDirection: 310.48,
            windSpeed: 100,
          },
        ],
      },
      {
        time: '2020-04-26T02:00:00+00:00',
        forecast: [
          {
            lat: -33.792726,
            lng: 151.289824,
            name: 'Manly',
            position: 'E',
            rating: 2,
            swellDirection: 182.56,
            swellHeight: 0.28,
            swellPeriod: 3.44,
            time: '2020-04-26T02:00:00+00:00',
            waveDirection: 232.86,
            waveHeight: 0.46,
            windDirection: 321.5,
            windSpeed: 100,
          },
        ],
      },
    ];
    const forecast = new Forecast(mockedStormGlassService);
    const beachesWithRating = await forecast.processForecastForBeaches(beaches);
    expect(beachesWithRating).toEqual(expectedResponse);
  });

  it('should throw internal processing error when something goes wrong during the rating process', async () => {
    const beaches: Beach[] = [
      {
        lat: -33.792726,
        lng: 151.289824,
        name: 'Manly',
        position: GeoPosition.E,
        user: 'some-id',
      },
    ];

    // mock do metodo fetchPoints (para forçar erro) que é usado
    // dentro do método processForecastForBeaches, o qual é
    // o método checado neste caso de teste
    mockedStormGlassService.fetchPoints.mockRejectedValue(
      'Error fetching data'
    );

    const forecast = new Forecast(mockedStormGlassService);
    await expect(
      forecast.processForecastForBeaches(beaches)
    ).rejects.toThrowError(ForecastProcessingInternalError);
  });
});
