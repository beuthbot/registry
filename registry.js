'use strict';
const axios = require('axios')
const services = require('./services.json')
const express = require('express')
const bodyParser = require('body-parser')
const NodeCache = require('node-cache')

const cache = new NodeCache()

const createCacheName = function(req) {
    // return string cacheName (<intent name> + _ + <entity value *>)
    // if entities.length <= 0: return undefined
    let cacheName = undefined
    if (req.body.entities.length > 0) {
        cacheName = req.body.intent.name
        for (let entity of req.body.entities) {
            cacheName = `${cacheName}_${entity.value}`
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
    let intent = message.intent.name.toLowerCase()
    if (services.includes(intent)) {
        const endpoint = process.env[intent.toUpperCase() + '_ENDPOINT'];
        console.log(intent + " " + endpoint)
        if (typeof endpoint === 'undefined') {
            message.answer = {
                "content": "Es tut mir leid ich kann das nicht",
                "history": ["registry"]
            }
            res.json(response)
            res.end();
            return
        }

        let cacheName = createCacheName(req)

        if (cacheName === undefined || cache.get(cacheName) === undefined) {
            axios.post(endpoint, { message })
                .then(function (response) {
                    response.data.answer.history.push("registry")
                    if(cacheName !== undefined) {
                        console.debug(`\n\ncached!\n${cacheName}\n\n`)
                        cache.set(cacheName, response.data.answer, response.data.answer.ttl || 30)
                    }
                    res.json(response.data)
                    res.end()
                })
        } else {
            console.debug(`\n\nusing cache!\n${cacheName}\n\n`)
            message.answer = cache.get(cacheName)
            res.json(message)
            res.end()
        }
    } else {
        console.debug(services)
        message.answer = {
            "content": "Es tut mir leid ich habe dich leider nicht verstanden",
            "history": ["registry"]
        }
        res.json(message)
        res.end();
    }
});

// start server
app.listen(3000)