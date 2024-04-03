const request = require('supertest')
const app = require('../app')
const User = require('../models/User')
const jwt = require('jsonwebtoken')
const { connect, close, clear } = require('./config/database.js')
const bcrypt = require('bcryptjs')
const { beforeEach, afterEach, beforeAll, afterAll } = require('@jest/globals')

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
        await connect()
    })

    beforeEach(async () => {
        const plainPassword = 'testpassword'
        const hashedPassword = await bcrypt.hash(plainPassword, 10)

        const user = new User({
            username: 'testuser',
            email: 'test@example.com',
            password: hashedPassword,
            role: 'targetOwner'
        })

        await user.save()
    })

    afterEach(async () => {
        await clear()
    })

    afterAll(async () => await close())

    describe('Login user', () => {
        it('should return 200 and a JWT token when logging in with correct credentials', async () => {
            const userCredentials = {
                username: 'testuser',
                password: 'testpassword'
            }

            const res = await request(app)
                .post('/auth/login')
                .send(userCredentials)

            console.log(res.body)

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

            expect(res.statusCode).toEqual(400)
        })
    })
})
