const axios = require('axios')
const routes =require('./serviceEndpoints.json')
var express = require('express')
var bodyParser = require('body-parser')
var app = express()
app.use(bodyParser.json()) // for parsing application/json
app.use(
    bodyParser.urlencoded({
        extended: true
    })
)

app.post('/get-response', function(req, res) {
    const {message} = req.body // message object
    message.history = "registry"
    var intent = message.evaluatedMessage.intent
    if(intent in routes){

        axios.post(routes[intent].route,
        {message
        }
        ).then(function (response){
            response.history = "registry"
            res.send(response)
            res.end()
        })
    }else{
        const response = {
            "request": message,
            "answer": "Es tut mir leid ich habe dich leider nicht verstanden",
            "history": "registry"

        }
        res.send(response)
        res.end();
    }

});

// start server
app.listen(3000, function() {
    console.log('Registry App listening on port 3000!')
})