require('dotenv').config({path: '../.env'});

const express = require('express');
const router = express.Router();
const axios = require('axios');
const CircuitBreaker = require('opossum');
const registerService = process.env.REGISTERSERVICE;
const gatewayToken = process.env.GATEWAY_TOKEN;
const options = {
    timeout: 3000,
    errorThresholdPercentage: 50,
    resetTimeout: 3000
};
const registerCB = new CircuitBreaker(callService, options);

// Route voor het registreren van een nieuwe gebruiker
router.post('/register', (req, res) => {
    let userData = req.body;
    const validRoles = ['participant', 'targetOwner']
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!userData || !userData.username || !userData.email || !userData.password || !userData.role || !validRoles.includes(userData.role) || !emailRegex.test(userData.email)) {
        return res.status(400).send('Ongeldige gegevens voor registratie.');
    }

    registerCB.fire('post', registerService, '/users/register', userData, gatewayToken)
        .then(response => {
            res.send(response);
        })
        .catch(error => {
            console.error('Fout bij het registreren van gebruiker:', error);
            res.status(500).send('Er is een fout opgetreden bij het registreren van de gebruiker.');
        });
});

// Route voor het ophalen van al de gebruikers
router.get('/get-users', (req, res) => {
    registerCB.fire('get', registerService, '/users/get')
        .then(response => {
            res.send(response);
        })
        .catch(error => {
            console.error('Fout bij het ophalen van de gebruikers:', error);
            res.status(500).send('Er is een fout opgetreden bij het ophalen van de gebruikers.');
        });
});

function callService(method, serviceAddress, resource, data) {
    return new Promise((resolve, reject) => {
        let url = `${serviceAddress}${resource}`;

        const headers = {
            'Gateway': `${gatewayToken}`,
            'Content-Type': 'application/json'
        };

        axios({
            method: method,
            url: url,
            headers: headers,
            data: data
        })
            .then(response => {
                resolve(response.data);
            })
            .catch(error => {
                reject(error.response);
            });
    });
}

registerCB.fallback((method, serviceAddress, resource, data, gateway, error) => {
    if(error && error.status !== undefined && error.statusText  !== undefined && error.data !== undefined && error.data.msg !== undefined)  {
        const status = error.status || 'Onbekend';
        const statusText = error.statusText || 'Onbekend';
        const errorMsg = error.data.msg || 'Geen foutbericht beschikbaar';

        console.error(`Fout bij het uitvoeren van het verzoek (${method.toUpperCase()} ${serviceAddress}${resource}):`, status, statusText, errorMsg);

        return `Oopsie, er ging iets mis. Fout: ${status} - ${statusText} - ${errorMsg}. Probeer het later opnieuw.`;
    } else {
        console.error(`Fout bij het uitvoeren van het verzoek (${method.toUpperCase()} ${serviceAddress}${resource})`);
    }

    return "De register service is offline. Probeer het later nog eens.";
});

module.exports = router;
