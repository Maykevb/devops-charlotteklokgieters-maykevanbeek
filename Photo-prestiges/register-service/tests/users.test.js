const request = require('supertest')
const app = require('../app.js')
const { connect, close, clear } = require('./config/database.js')
const User = require('../models/User')
const { afterEach, beforeAll, afterAll } = require('@jest/globals')

const agent = request.agent(app, {})

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
}))

describe('User tests', () => {
    beforeAll(async () => await connect())

    afterEach(async () => await clear())

    afterAll(async () => await close())

    describe('Register user', () => {
        it('should return 200 and a success message when registering a new user', async () => {
            const user = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'testpassword',
                role: 'participant'
            }

            const res = await agent
                .post('/users/register')
                .send(user)

            expect(res.statusCode).toEqual(200)
            expect(res.body.msg).toEqual('Gebruiker succesvol geregistreerd')
        })
    })

    describe('Get all users', () => {
        test('should return 200 and an array of users with testuser in it', async () => {
            const user = {
                username: 'testuser',
                email: 'test@example.com',
                password: 'testpassword',
                role: 'participant'
            }

            await new User(user)

            const res = await agent
                .get('/users/get')

            const testUser = res.body.find(u => u.username === 'testuser')

            expect(res.statusCode).toEqual(200)
            expect(Array.isArray(res.body)).toBe(true)
            expect(testUser).toBeDefined()
        })
    })
})
