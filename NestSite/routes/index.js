var pg = require('pg');
var express = require('express');
var validator = require('validator');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    var CurrentTemp = '\nvar curTemp = [];'
    var TargetTempHigh = '\nvar targetTempHigh = [];';
    var TargetTempLow = 'var targetTempLow = [];';
    var Humidity = 'var humidity = [];';
    var TargetTemp= 'var targetTemp = [];';
    var RelHumidity = 'var relHumidity = [];';
    var WeatherTemp = 'var weatherTemp = [];';
    var WindchillTemp = 'var windchillTemp = [];';

    scripts = CurrentTemp + TargetTempHigh + TargetTempLow + Humidity + TargetTemp;
    res.render('index', { 
        title: 'Nest Graphs', 
        scripts: scripts
    })
});

router.post('/', function(req,res) {
    // TODO: Retrieve data from postgres
    // TODO: Wrap in JSON and send back
    var conString = "postgres://kevin:5433@localhost/kevin";
    // get a pg client from the connection pool
    pg.connect(conString, function(err, client, done) {
        var handleError = function(err) {
            // no error occurred, continue with the request
            if(!err) return false;

            // An error occurred, remove the client from the connection pool.
            // A truthy value passed to done will remove the connection from the pool
            // instead of simply returning it to be reused.
            // In this case, if we have successfully received a client (truthy)
            // then it will be removed from the pool.
            done(client);
            res.writeHead(500, {'content-type': 'text/plain'});
            res.end('An error occurred: ' + err);
            return true;
        };

        if (req.body.hasOwnProperty('type')) {
            var reqType = req.body.type;

            if (validator.equals(reqType, 'thermo')) {
                var DBData = {
                    targetTemp: [],
                    currentTemp: [],
                    targetTempLow: [],
                    targetTempHigh: [],
                    humidity: []
                };

                var query = client.query('SELECT *,curr_time - interval \'6 hour\' as curr_time2 FROM nest_thermo_data order by curr_time');
                query.on('row', function(row) {
                    var t = new Date(row['curr_time2']).getTime();
                    DBData.targetTemp.push([t,row['target_temperature_c']]);
                    DBData.targetTempLow.push([t,row['target_temperature_low_c']]);
                    DBData.targetTempHigh.push([t,row['target_temperature_high_c']]);
                    DBData.currentTemp.push([t,row['ambient_temperature_c']]);
                    DBData.humidity.push([t,row['humidity']]);
                });
            } else if (validator.equals(reqType, 'weather')) {
                var DBData = {
                    weatherTemp: [],
                    windchillTemp: [],
                    relHumidity: []
                };
                var query = client.query('SELECT *,curr_time - interval \'6 hour\' as curr_time2 FROM weather_thermo_data order by curr_time');
                query.on('row', function(row) {
                    var t = new Date(row['curr_time2']).getTime();
                    DBData.weatherTemp.push([t,row['temp_c']]);
                    DBData.relHumidity.push([t,row['humidity']]);
                    DBData.windchillTemp.push([t,row['windchill_c']]);
                });
            } else {
                console.log('INCORRECT POST DATA!');
            }
        }

        // End query
        query.on('end', function() { 
            client.end();

            if (DBData) {
                res.send(JSON.stringify(DBData));
            }

            DBData = {
                targetTemp: [],
                currentTemp: [],
                targetTempLow: [],
                targetTempHigh: [],
                humidity: []
            };
        });
    });
});
module.exports = router;
