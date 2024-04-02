require('dotenv').config({ path: '../.env' })

const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const User = require('../models/User')
const amqp = require('amqplib')
let channel = null
const amqpUrl = process.env.AMQP_URL

async function connectToRabbitMQ () {
    try {
        const connection = await amqp.connect(amqpUrl)
        channel = await connection.createChannel()

        const exchangeName = 'user_exchange'
        const queueName = 'user_queue'
        const routingKey = 'user.created'

        await channel.assertExchange(exchangeName, 'direct', { durable: true })
        await channel.assertQueue(queueName, { durable: true })
        await channel.bindQueue(queueName, exchangeName, routingKey)

        console.log('Verbonden met RabbitMQ')
    } catch (error) {
        console.error('Error connecting to RabbitMQ:', error)
        console.log('Retrying connection in 5 seconds...')
        await new Promise(resolve => setTimeout(resolve, 10000))
        await connectToRabbitMQ()
    }
}

// Route voor het registreren van een nieuwe gebruiker
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, role } = req.body

        let user = await User.findOne({ username })
        if (user) {
            return res.status(400).json({ msg: 'Gebruiker bestaat al' })
        }

        user = new User({
            username,
            email,
            password,
            role
        })

        const salt = await bcrypt.genSalt(10)
        user.password = await bcrypt.hash(password, salt)

        await user.save()

        if (channel) {
            const exchangeName = 'user_exchange'
            const routingKey = 'user.created'
            const message = JSON.stringify(user)
            channel.publish(exchangeName, routingKey, Buffer.from(message), { persistent: true })
            console.log('User created message sent to RabbitMQ')
        } else {
            console.log('RabbitMQ channel is not available. Message not sent.')
        }

        res.json({ msg: 'Gebruiker succesvol geregistreerd' })
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Serverfout')
    }
})

// Route voor het ophalen van al de gebruikers
router.get('/get', async (req, res) => {
    try {
        const users = await User.find().select('-password -__v')

        res.json(users)
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Serverfout')
    }
})

connectToRabbitMQ()

module.exports = router
