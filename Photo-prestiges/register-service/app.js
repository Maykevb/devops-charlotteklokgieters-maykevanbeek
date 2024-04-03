require('dotenv').config({ path: '../.env' })

const express = require('express')
const mongoose = require('mongoose')
const usersRoutes = require('./routes/users')
const app = express()
const url = process.env.REGISTER_MONGO_URL
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
app.use('/users', usersRoutes)

if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(url)
        .then(() => console.log('MongoDB Connected'))
        .catch(err => console.log(err))

    app.set('port', process.env.REGISTERPORT || 4000)

    const server = http.createServer(app)
    const port = process.env.REGISTERPORT || 4000

    server.listen(port, () => console.log(`Listening on port ${port}`))
}

module.exports = app
