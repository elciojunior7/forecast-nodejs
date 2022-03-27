import { User } from '@src/models/user';
import AuthService from '@src/services/auth';

describe('Users functional tests', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });
  describe('When creating a new user', () => {
    it('should successfully create a new user with encrypted password', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'john@mail.com',
        password: '1234',
      };
      const response = await global.testRequest.post('/users').send(newUser);
      expect(response.status).toBe(201);
      await expect(AuthService.comparePasswords(newUser.password, response.body.password))
              .resolves.toBeTruthy(); //resolves para aguardar o resultado da Promise 
                                      //e toBeTruthy para validar a comparação de password
      expect(response.body).toEqual(expect.objectContaining({
          ...newUser,
          ...{ password: expect.any(String) },
        })
        // expect any apenas testa se o valor recebido em determinada 
      // propriedade do objeto é de algum tipo (string no caso)
      // e não se o valor é exato
      // no caso acima, o objectContainig vai testar se todas as propriedades existem
      // conforme o que existe no newUser e seus valores, o expect any troca a validação do password
      // para não validar se o valor é igual mas para validar apenas se o valor é uma String qualquer
      );
    });

    it('Should return 422 when there is a validation error', async () => {
        const newUser = {
          email: 'john@mail.com',
          password: '1234',
        };
        const response = await global.testRequest.post('/users').send(newUser);
  
        expect(response.status).toBe(422);
        expect(response.body).toEqual({
          code: 422,
          error: 'User validation failed: name: Path `name` is required.',
        });
    });

    it('Should return 409 when the email already exists', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'john@mail.com',
        password: '1234',
      };
      await global.testRequest.post('/users').send(newUser);
      const response = await global.testRequest.post('/users').send(newUser);

      expect(response.status).toBe(409);
      expect(response.body).toEqual({
        code: 409,
        error: 'User validation failed: email: already exists in the database.',
      });
    });
  });
  describe('when authenticating a user', () => {
    it('should generate a token for a valid user', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'john@mail.com',
        password: '1234',
      };
      await new User(newUser).save();
      const response = await global.testRequest.post('/users/authenticate')
        .send({ email: newUser.email, password: newUser.password });
  
      // expect any apenas testa se o valor recebido em determinada 
      // propriedade do objeto é de algum tipo (string no caso)
      // e não se o valor é exato
      expect(response.body).toEqual(expect.objectContaining({ token: expect.any(String) })
      );
    });
    it('Should return UNAUTHORIZED if the user with the given email is not found', async () => {
      const response = await global.testRequest
        .post('/users/authenticate')
        .send({ email: 'some-email@mail.com', password: '1234' });
  
      expect(response.status).toBe(401);
    });
  
    it('Should return UNAUTHORIZED if the user is found but the password does not match', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'john@mail.com',
        password: '1234',
      };
      await new User(newUser).save();
      const response = await global.testRequest
        .post('/users/authenticate')
        .send({ email: newUser.email, password: 'different password' });
  
      expect(response.status).toBe(401);
    });
  });
});

