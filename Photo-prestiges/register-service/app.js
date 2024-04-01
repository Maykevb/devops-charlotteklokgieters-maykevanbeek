const express = require('express')
const mongoose = require('mongoose')
const usersRoutes = require('./routes/users')
const db = mongoose.connection
const app = express()
const url = process.env.REGISTER_MONGO_URL

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use('/users', usersRoutes)

// MongoDB-verbinding
mongoose.connect(url)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err))

// Het opstarten van de server
const PORT = process.env.REGISTERPORT || 4000
app.listen(PORT, () => {
    console.log(`Server gestart op poort ${PORT}`)
})

module.exports = { app, db }
