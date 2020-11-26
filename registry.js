'use strict';
const axios = require('axios')
const services = require('./registry.json')
const express = require('express')
const bodyParser = require('body-parser')
const NodeCache = require('node-cache')
const util = require('util')
const cache = new NodeCache()

const createCacheName = function(req) {
    // return string cacheName (<intent name> + _ + <entity value *>)
    // if entities.length <= 0: return undefined
    let cacheName = undefined

    // check entities
    if (req.body && req.body.entities && req.body.entities.length > 0) {
        cacheName = req.body.intent.name
        for (let entity of req.body.entities) {
            cacheName = `${cacheName}_${entity.value}`
        }
    }

    // check user
    if (req.body && req.body.user && req.body.user.details) {
        for (const [ key, value ] of Object.entries(req.body.user.details)) {
            cacheName = `${cacheName}_${key}:${value}`
        }
    }

    return cacheName
}

const app = express()
app.use(bodyParser.json()) // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true }))

// present a simple hello text on a `GET` request on the base URL.  this can be use to check whether the registry
// is running or not.
app.get('/', function (req, res) {
    res.send('Hello from BeuthBot Registry')
    res.end()
})

app.post('/get-response', function (req, res) {
    const message = req.body
    console.log('req.body', req.body)

    const historyAdd = ['registry'];
    const history = message.history ? message.history.concat(historyAdd) : historyAdd;
    message.history = history;

    let intent = message.intent
    if (!intent || !intent.name) {
        message.error = "message has no intent property"
        message.answer = {
            "content": "Es tut mir leid. Es ist ein interner Fehler in der Registry aufgetreten.",
            history
        }
        res.json(message)
        res.end();
        return
    }

    let intentName = intent.name.toLowerCase()
    let endpointName = services[intentName]

    if (endpointName) {

        const endpoint = process.env[endpointName];
        console.log(intent + " " + endpoint)

        if (typeof endpoint === 'undefined') {
            message.error = "no environment var given for " + endpointName
            message.answer = {
                "content": "Es tut mir leid. Es ist ein interner Fehler in der Registry aufgetreten.",
                history
            }
            res.json(message)
            res.end();
            return
        }

        let cacheName = createCacheName(req)

        if (cacheName === undefined || cache.get(cacheName) === undefined) {
            axios.post(endpoint, { message })
                .then(function (response) {
                    if (response.data.answer && response.data.answer.history) {
                        response.data.answer.history.push("registry")
                    }

                    if(cacheName !== undefined && !cacheName.startsWith("database") && response.data.answer) {
                        console.debug(`\n\ncached!\n${cacheName}\n\n`)
                        cache.set(cacheName, response.data.answer, response.data.answer.ttl || 1800)
                    }

                    console.debug("response.data:\n" + util.inspect(response.data, false, null, true))

                    res.json(response.data)
                    res.end()
                })
        } else {
            console.debug(`\n\nusing cache!\n${cacheName}\n\n`)
            message.answer = cache.get(cacheName)
            message.answer.history = history.concat(['registry_cache']);
            res.json(message)
            res.end()
        }
    } else {
        console.debug(services)
        message.error = "no endpoint registered for " + intent
        message.answer = {
            "content": "Es tut mir leid. Der Service um die Anfrage zu beantworten ist nicht registriert.",
            history
        }
        res.json(message)
        res.end();
    }
});

// start server
app.listen(3000)
