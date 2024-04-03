require('dotenv').config({ path: '../.env' })

const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')

// Route voor het inloggen van een gebruiker
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body

        const user = await User.findOne({ username })
        if (!user) {
            return res.status(400).json({ msg: 'Gebruiker niet gevonden' })
        }

        const isMatch = await bcrypt.compare(password, user.password)
        if (!isMatch) {
            return res.status(400).json({ msg: 'Ongeldig wachtwoord' })
        }

        console.log(user.role)
        const secretKey = checkRole(user.role)
        if (!secretKey) {
            return res.status(422).json({ msg: 'De gebruiker heeft geen geldige rol' })
        }

        const payload = {
            user: {
                id: user.id,
                username: user.username
            }
        }

        jwt.sign(
            payload,
            secretKey,
            { expiresIn: 3600 },
            (err, token) => {
                if (err) {
                    console.error(err.message)
                    return res.status(500).json({ msg: 'Er is een fout opgetreden bij het genereren van het token' })
                }
                res.json({ token })
            }
        )
    } catch (err) {
        console.error(err.message)
        res.status(500).send('Serverfout')
    }
})

// Check om de juiste geheime sleutel op te halen op basis van de rol van de gebruiker
function checkRole (role) {
    let secretKey

    switch (role) {
        case 'participant':
            secretKey = process.env.JWT_SECRET_PARTICIPANT
            break
        case 'targetOwner':
            secretKey = process.env.JWT_SECRET_TARGETOWNER
            break
        default:
            return null
    }

    return secretKey
}

module.exports = router
