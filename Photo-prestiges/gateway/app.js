const express = require('express');
const app = express();
const port = process.env.GATEWAYPORT || 5000;
const registerRoutes = require('./routes/register-gateway');
const authRoutes = require('./routes/auth-gateway');
const cors = require('cors');

const swaggerUI = require('swagger-ui-express')
const swaggerDocument = require('./swagger.json');
app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

app.use(cors())
app.use(express.json());

app.post('/register', registerRoutes);
app.post('/login', authRoutes);

app.get('/get-users', registerRoutes)

app.listen(port, () => {
    console.log('Server is up on port ' + port)
})
