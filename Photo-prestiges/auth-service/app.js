require('dotenv').config({ path: '../.env' })

const express = require('express')
const mongoose = require('mongoose')
const authRoutes = require('./routes/auth')
const amqp = require('amqplib')
const User = require('./models/User')
const bcrypt = require('bcryptjs')
const app = express()
const amqpUrl = process.env.AMQP_URL
const url = process.env.AUTH_MONGO_URL
const http = require('http')
const promBundle = require('express-prom-bundle')
const metricsMiddleware = promBundle({
    includePath: true,
    includeStatusCode: true,
    normalizePath: true,
    promClient: {
        collectDefaultMetrics: {}
    }
})

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(metricsMiddleware)
app.use('/auth', authRoutes)

async function connectToRabbitMQ () {
    try {
        const connection = await amqp.connect(amqpUrl)
        const channel = await connection.createChannel()
        const exchangeName = 'user_exchange'
        const queueName = 'auth_service_queue'

        await channel.assertExchange(exchangeName, 'direct', { durable: true })
        await channel.assertQueue(queueName, { durable: true })
        await channel.bindQueue(queueName, exchangeName, 'user.created')

        channel.consume(queueName, async (message) => {
            if (message) {
                try {
                    const user = JSON.parse(message.content.toString())
                    console.log('Ontvangen gebruiker:', user)

                    const isPasswordHashed = /^(?=.*[a-zA-Z])(?=.*[0-9])/.test(user.password)
                    const hashedPassword = isPasswordHashed ? user.password : await bcrypt.hash(user.password, 10)

                    const newUser = new User({
                        username: user.username,
                        email: user.email,
                        password: hashedPassword,
                        role: user.role
                    })
                    await newUser.save()

                    console.log('Gebruiker succesvol opgeslagen in de database van auth-service')
                } catch (error) {
                    console.error('Fout bij het opslaan van de gebruiker:', error)
                }
            }
        }, { noAck: true })

        console.log('Verbonden met RabbitMQ!')
    } catch (error) {
        console.error('Error connecting to RabbitMQ:', error)
        console.log('Retrying connection in 5 seconds...')
        await new Promise(resolve => setTimeout(resolve, 10000))
        await connectToRabbitMQ()
    }
}

if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(url)
        .then(() => console.log('MongoDB Connected'))
        .catch(err => console.log(err))

    connectToRabbitMQ()

    app.set('port', process.env.AUTHPORT || 5000)

    const server = http.createServer(app)
    const port = process.env.AUTHPORT || 5000

    server.listen(port, () => console.log(`Listening on port ${port}`))
}

module.exports = app
