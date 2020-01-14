const axios = require('axios')
var express = require('express')
var bodyParser = require('body-parser')
var app = express()
app.use(bodyParser.json()) // for parsing application/json
app.use(
    bodyParser.urlencoded({
        extended: true
    })
)

app.post('/message-in', function(req, res) {
    const {message} = req.body // message object
    message.history = "registry";
    if(message.evaluatedMessage.intent == "mensa"){

        axios.post('/mensa',
        {message
        }
        ).then(function (response){
            response.history = "registry";
            res.end()
        })

    }else if(message.evaluatedMessage.intent == "wetter"){
        axios.post('/mensa',
            {message
            }
        ).then(function (response){
            response.history = "registry";
            res.end()
        })

    }else if(message.evaluatedMessage.intent == "oeffnungszeiten"){
        axios.post('/mensa',
            {message
            }
        ).then(function (response){
            response.history = "registry";
            res.end()
        })

    }else{
        const response = {
            "request": message,
            "anser": "Es tut mir leid ich habe dich leider nicht verstanden",
            "history": "registry"

        }
        res.end();
    }

});

// start server
app.listen(3000, function() {
    console.log('Registry App listening on port 3000!')
})