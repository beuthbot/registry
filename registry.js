
const axios = require('axios')
const services = require('./services.json')
var express = require('express')
var bodyParser = require('body-parser')
var app = express()
app.use(bodyParser.json()) // for parsing application/json
app.use(
    bodyParser.urlencoded({
        extended: true
    })
)

// present a simple hello text on a `GET` request on the base URL.  this can be use to check whether the deconcentrator
// is running or not.
app.get('/', function(req, res) {
    res.send('Hello from BeuthBot Registry')
    res.end()
})

app.post('/get-response', function(req, res) {
    const message = req.body
    var intent = message.intent.name.toLowerCase()
    if (services.includes(intent)){
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

        axios.post(
		endpoint,
	        {message}
        )
	.then(function (response){
            response.data.answer.history.push("registry")
            res.json(response.data)
            res.end()
        })
    }else{

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
