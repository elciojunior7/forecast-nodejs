import config, { IConfig } from 'config';
import { connect as mongooseConnect, connection } from 'mongoose';

// acesso ao valor do arquivo de config
const dbConfig: IConfig = config.get('App.database');

export const connect = async (): Promise<void> => {
  await mongooseConnect(dbConfig.get('mongoUrl'));
};

//método que fecha conexão com BD
export const close = (): Promise<void> => connection.close();
