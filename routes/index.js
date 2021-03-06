var pg = require('pg');
var express = require('express');
var validator = require('validator');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res) {
    res.render('index', { 
        title: 'Nest Graphs'
    });
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

        var query = {};
        var DBData = {};
        if (req.body.hasOwnProperty('type')) {
            var reqType = req.body.type;

            if (validator.equals(reqType, 'thermo')) {
                DBData = {
                    targetTemp: [],
                    currentTemp: [],
                    targetTempLow: [],
                    targetTempHigh: [],
                    humidity: []
                };

                query = client.query('SELECT *,curr_time - interval \'6 hour\' as curr_time2 FROM nest_thermo_data order by curr_time');
                query.on('row', function(row) {
                    var t = new Date(row.curr_time2).getTime();
                    DBData.targetTemp.push([t,row.target_temperature_c]);
                    DBData.targetTempLow.push([t,row.target_temperature_low_c]);
                    DBData.targetTempHigh.push([t,row.target_temperature_high_c]);
                    DBData.currentTemp.push([t,row.ambient_temperature_c]);
                    DBData.humidity.push([t,row.humidity]);
                });
            } else if (validator.equals(reqType, 'weather')) {
                DBData = {
                    weatherTemp: [],
                    windchillTemp: [],
                    relHumidity: []
                };
                query = client.query('SELECT *,curr_time - interval \'6 hour\' as curr_time2 FROM weather_thermo_data order by curr_time');
                query.on('row', function(row) {
                    var t = new Date(row.curr_time2).getTime();
                    DBData.weatherTemp.push([t,row.temp_c]);
                    DBData.relHumidity.push([t,row.humidity]);
                    DBData.windchillTemp.push([t,row.windchill_c]);
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

            DBData = {};
        });
    });
});
module.exports = router;
