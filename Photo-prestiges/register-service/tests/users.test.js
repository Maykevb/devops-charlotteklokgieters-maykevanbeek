const request = require('supertest');
const { app, db } = require('../app');
const user = require("../models/User");
const { beforeAll, afterAll } = require("@jest/globals");

jest.mock('amqplib', () => ({
    connect: jest.fn(() => Promise.resolve({
        createChannel: jest.fn(() => Promise.resolve({
            assertExchange: jest.fn(),
            assertQueue: jest.fn(),
            bindQueue: jest.fn(),
            publish: jest.fn(),
            close: jest.fn()
        })),
        close: jest.fn()
    }))
}));

describe("User tests", () => {
    beforeAll(async () => {
        await user.deleteMany({ username: 'testuser' });
    });

    afterAll(async () => {
        await user.deleteMany({ username: 'testuser' });
        await new Promise(resolve => setTimeout(() => resolve(), 1500));
        await db.close();
    });

    describe("Register user", () => {
        it('should return 200 and a success message when registering a new user', async () => {
            const user = {
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

    describe('Get all users', () => {
        test('should return 200 and an array of users with testuser in it', async () => {
            const res = await request(app)
                .get('/users/get')
                .set('Gateway', process.env.GATEWAY_TOKEN);

            const testUser = res.body.find(u => u.username === 'testuser');

            expect(res.statusCode).toEqual(200);
            expect(Array.isArray(res.body)).toBe(true);
            expect(testUser).toBeDefined();
        });
    });
});
