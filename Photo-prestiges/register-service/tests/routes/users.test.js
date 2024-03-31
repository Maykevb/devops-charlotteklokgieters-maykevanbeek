const request = require('supertest');
const { app, db, client } = require('../../app');

beforeEach(async () => {
    await db.collection('users').deleteMany({});
});

afterAll(async() => {
    await client.close();
});

describe('POST /users/register', () => {
    it('should return 200 and a success message when registering a new user', async () => {
        user = {
            username: 'testuser',
            email: 'test@example.com',
            password: 'testpassword',
            role: 'participant'
        }

        const res = await request(app)
            .post('/users/register')
            .send(user)
            .set('Gateway', process.env.GATEWAY_TOKEN);

        expect(res.statusCode).toEqual(200);
        expect(res.body.msg).toEqual('Gebruiker succesvol geregistreerd');
    });
});

describe('GET /users/get', () => {
    test('should return 200 and an array of users', async () => {
        const res = await request(app)
            .get('/users/get')
            .set('Gateway', process.env.GATEWAY_TOKEN);

        expect(res.statusCode).toEqual(200);
        expect(Array.isArray(res.body)).toBe(true);
    });
});
