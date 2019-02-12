const express = require('express');
var https = require('https');
var app = express();
var path = require('path');
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');
app.use(express.static(path.join(__dirname, 'public')));



app.get('/', function (req, res) {
    res.render('index');
});

app.get('/datasample', (req,res) => {
    var url = 'https://dl.dropboxusercontent.com/s/ri6i1qxlk15k2md/fl-insurance.geojson';

    https.get
    (url, function(response){
        var body = '';

        response.on('data', function(chunk){
            body += chunk;
        });
        response.on('end', function(){
            var parsedJson = JSON.parse(body);
            var features = parsedJson['features'];

            res.send(parsedJson);
        });
    }).on('error', function(e){
        console.log("error: ", e);
    });

});

app.listen(3000, function () {
    console.log('Mapbox practice app listening on port 3000')
});
