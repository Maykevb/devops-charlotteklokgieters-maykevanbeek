const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
let mongoServer

const connect = async () => {
    mongoServer = await MongoMemoryServer.create()
    await mongoose.connect(mongoServer.getUri())
}

const close = async () => {
    await mongoose.connection.dropDatabase()
    await mongoose.connection.close()
    await mongoServer.stop()
}

const clear = async () => {
    const collections = mongoose.connection.collections
    for (const key in collections) {
        await collections[key].deleteMany({})
    }
}

module.exports = { connect, close, clear }
