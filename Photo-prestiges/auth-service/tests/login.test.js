const request = require('supertest')
const { app, db } = require('../app')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const { beforeAll, afterAll } = require('@jest/globals')

jest.mock('amqplib', () => ({
    connect: jest.fn(() => Promise.resolve({
        createChannel: jest.fn(() => Promise.resolve({
            assertExchange: jest.fn(),
            assertQueue: jest.fn(),
            bindQueue: jest.fn(),
            publish: jest.fn(),
            consume: jest.fn(),
            close: jest.fn()
        })),
        close: jest.fn()
    }))
}))

describe('Login tests', () => {
    beforeAll(async () => {
        await new Promise(resolve => setTimeout(() => resolve(), 1500))
        
        const plainPassword = 'testpassword'
        const hashedPassword = await bcrypt.hash(plainPassword, 10)

        const user = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: hashedPassword,
            role: 'participant'
        })

        await user.save()
    })

    afterAll(async () => {
        await User.deleteMany({ username: 'testuser' })
        await new Promise(resolve => setTimeout(() => resolve(), 1500))
        await db.close()
    })

    describe('Login user', () => {
        it('should return 200 and a JWT token when logging in with correct credentials', async () => {
            const userCredentials = {
                username: 'testuser',
                password: 'testpassword'
            }

            const res = await request(app)
                .post('/auth/login')
                .send(userCredentials)
                .set('Gateway', process.env.GATEWAY_TOKEN)

            const decodedToken = jwt.decode(res.body.token)

            expect(res.statusCode).toEqual(200)
            expect(res.body.token).toBeDefined()
            expect(decodedToken.user.username).toEqual(userCredentials.username)
        })

        it('should return 400 if user is not found', async () => {
            const nonExistingUser = {
                username: 'nonexistinguser',
                password: 'testpassword'
            }

            const res = await request(app)
                .post('/auth/login')
                .send(nonExistingUser)
                .set('Gateway', process.env.GATEWAY_TOKEN)

            expect(res.statusCode).toEqual(400)
        })

        it('should return 400 if password is incorrect', async () => {
            const incorrectPasswordUser = {
                username: 'testuser',
                password: 'incorrectpassword'
            }

            const res = await request(app)
                .post('/auth/login')
                .send(incorrectPasswordUser)
                .set('Gateway', process.env.GATEWAY_TOKEN)

            expect(res.statusCode).toEqual(400)
        })
    })
})
