import mongoose, {Document, Model, Schema} from "mongoose";

// enum de pontos cardinais
export enum BeachPosition {
    S = 'S',
    E = 'E',
    W = 'W',
    N = 'N',
}

// tipo usado para representar praia
export interface Beach {
    name: string;
    position: BeachPosition;
    lat: number;
    lng: number;
    user: string;
}

const schema = new mongoose.Schema(
    {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
      name: { type: String, required: true },
      position: { type: String, required: true },
      user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    {
      // sempre que a função toJSON for acionado, o transform vai agir
      toJSON: {
        // transformação aplicada nos dados devolvidos via Json
        // deletes daqui não acontecem no banco de dados
        transform: (_, ret): void => {
          ret.id = ret._id;
          delete ret._id;
          delete ret.__v;
        },
      },
    }
  );

// interface/tipo para poder ter instâncias que mescla
// do tipo/interface Beach (linha 12) e do 
// Document do mongoose
interface BeachModel extends Omit<Beach, '_id'>, Document {}

// faz o export de um Beach que se comporta como um Model mangoose
// e que tem o schema acima (linha 20)
// para sobrescever o tipo Model, o tipo BeachModel precisava ser também
// do tipo Document. Por isso, a interface BeachModel extends de Document
export const Beach: Model<BeachModel> = mongoose.model('Beach', schema);