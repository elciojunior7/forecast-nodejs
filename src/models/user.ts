import logger from '@src/logger';
import AuthService from '@src/services/auth';
import mongoose, { Document, Model } from 'mongoose';

export interface User {
  _id?: string;
  name: string;
  email: string;
  password: string;
}

export enum CUSTOM_VALIDATION {
  DUPLICATED = 'DUPLICATED',
}

interface UserModel extends Omit<User, '_id'>, Document {}

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: { type: String, required: true },
  },
  {
    toJSON: {
      transform: (_, ret): void => {
        ret.id = ret._id;
        delete ret._id;
        delete ret.__v;
      },
    },
  }
);

// hook path
// validação criada manualmente para verificar se um email já foi cadastrado no BD
// e assim, definir um tipo (DUPLICATED) para a exception que vai ser disparada
// caso tenha duplicação
schema.path('email').validate(
  async (email: string) => {
    const emailCount = await mongoose.models.User.countDocuments({ email });
    return !emailCount;
  },
  'already exists in the database.',
  CUSTOM_VALIDATION.DUPLICATED
);

// neste hook chamado "pre", que dispara antes de um save de user
// o async function tem a função de criar um contexto apenas para a função em questão
// se estivesse async => () (arrow function), o contexto usado seria do módulo/arquivo todo
// e então o "this" não seria do contexto da função, o que resultaria em discrepâncias
// ao chamar um this.password ou this.isModified, que são ambos estados e ação do
// UserModel declarado mais acima
schema.pre<UserModel>('save', async function (): Promise<void> {
  // isModified verifica se a senha está igual a antes
  // aconteceria em caso de update, e estaria em formato hash
  // não se deve fazer hash do hash e salvar no banco pois vai mudar a senha
  // not isModified tem a função de testar para no return vazio em seguida
  // evitar que a senha senha atualizada de forma equivocada
  if (!this.password || !this.isModified('password')) {
    return;
  }
  try {
    const hashedPassword = await AuthService.hashPassword(this.password);
    this.password = hashedPassword;
  } catch (err) {
    logger.error(`Error hashing the password for the user ${this.name}`, err);
  }
});

export const User: Model<UserModel> = mongoose.model('User', schema);
