import axios, { AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

/* eslint-disable @typescript-eslint/no-empty-interface */
export interface RequestConfig extends AxiosRequestConfig {}
/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Response<T = any> extends AxiosResponse<T> {}

export class Request {
  constructor(private request = axios) {}

  // uso de generic (T) do typescrpt para permitir que o response seja tipado
  // independemente do tipo que seja passado como referencia
  // se for passado get<StormGlassType>, o response já fica definido como Response<StormGlassType>
  public get<T>(url: string, config: RequestConfig = {}): Promise<Response<T>> {
    return this.request.get<T, Response<T>>(url, config);
  }

  // função estática que testa se é um erro devolvido pela API
  // (requisição chegou até a API)
  public static isRequestError(error: Error): boolean {
    // dupla exclamação força o resultado ser boolean, evitando
    return !!(
      (error as AxiosError).response && (error as AxiosError).response?.status
    );
  }

  // adequa o error handler em caso de erro devolvido pela API
  // para poder funcionar com versões mais recentes de Typescript
  // que força o uso da tipagem unknown em erros, ao inves de any, como era
  public static extractErrorData(
    error: unknown
  ): Pick<AxiosResponse, 'data' | 'status'> {
    const axiosError = error as AxiosError;
    if (axiosError.response && axiosError.response.status) {
      return {
        data: axiosError.response.data,
        status: axiosError.response.status,
      };
    }
    throw Error(`The error ${error} is not a Request Error`);
  }
}
