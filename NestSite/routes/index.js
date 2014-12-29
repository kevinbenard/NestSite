var pg = require('pg');
var express = require('express');
var router = express.Router();

var DBData = {
    targetTemp: [],
    currentTemp: [],
    targetTempLow: [],
    targetTempHigh: [],
    humidity: []
};
var output = '';
var i = 0;
var CurrentTemp = '\nvar curTemp = [];'
var TargetTempHigh = '\nvar targetTempHigh = [];';
var TargetTempLow = 'var targetTempLow = [];';
var Humidity = 'var humidity = [];';
var TargetTemp= 'var targetTemp = [];';

/* GET home page. */
router.get('/', function(req, res) {
    // TODO: Retrieve data from postgres
    // TODO: Wrap in JSON and send back
    //var conString = process.env.conURL;
    // get a pg client from the connection pool
    //pg.connect(conString, function(err, client, done) {
        //var handleError = function(err) {
            //// no error occurred, continue with the request
            //if(!err) return false;

            //// An error occurred, remove the client from the connection pool.
            //// A truthy value passed to done will remove the connection from the pool
            //// instead of simply returning it to be reused.
            //// In this case, if we have successfully received a client (truthy)
            //// then it will be removed from the pool.
            //done(client);
            //res.writeHead(500, {'content-type': 'text/plain'});
            //res.end('An error occurred: ' + err);
            //return true;
        //};

        //var query = client.query('SELECT *, curr_time - interval \'6 hour\' as curr_time2 FROM nest_thermo_data order by curr_time LIMIT 2');
        //query.on('row', function(row) {
            //var t = new Date(row['curr_time2']).getTime();
            ////var t = row['last_connect'];
            ////CurrentTemp += '[' + t  + ', ' + row['ambient_temperature_c'] + '], ';
            ////TargetTempLow += '[' + t  + ', ' + row['target_temperature_low_c'] + '], ';
            ////TargetTempHigh += '[' + t + ', ' + row['target_temperature_high_c'] + '], ';
            ////Humidity += '[' + t + ', ' + row['humidity'] + '], ';
            ////TargetTemp+= '[' + t + ', ' + row['target_temperature_c'] + '], ';
            ////console.log(JSON.stringify(row));
            //i += 1;
        //});

        // End query
        //query.on('end', function() { 
            //var scripts = '';
            //client.end();
            //CurrentTemp = CurrentTemp.substring(0, CurrentTemp.length - 2);
            //TargetTempLow = TargetTempLow.substring(0, TargetTempLow.length - 2);
            //TargetTempHigh = TargetTempHigh.substring(0, TargetTempHigh.length - 2);
            //Humidity = Humidity.substring(0, Humidity.length - 2);
            //TargetTemp = TargetTemp.substring(0, TargetTemp.length - 2);
            //CurrentTemp += '];\n';
            //TargetTempLow += '];\n';
            //TargetTempHigh += '];\n';
            //Humidity += '];\n';
            //TargetTemp += '];\n';
            scripts = CurrentTemp + TargetTempHigh + TargetTempLow + Humidity + TargetTemp;

            //console.log(JSON.stringify(DBData));

            //CurrentTemp = '';
            //TargetTempLow = '';
            //TargetTempHigh = '';
            //Humidity = '';
            //TargetTemp = '';
            //i = 0;
        //});
    //});
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
        //output = '[';
        var query = client.query('SELECT *,curr_time - interval \'6 hour\' as curr_time2 FROM nest_thermo_data order by curr_time');
        query.on('row', function(row) {
            var t = new Date(row['curr_time2']).getTime();
            DBData.targetTemp.push([t,row['target_temperature_c']]);
            DBData.targetTempLow.push([t,row['target_temperature_low_c']]);
            DBData.targetTempHigh.push([t,row['target_temperature_high_c']]);
            DBData.currentTemp.push([t,row['ambient_temperature_c']]);
            DBData.humidity.push([t,row['humidity']]);
        });

        // End query
        query.on('end', function() { 
            client.end();

            res.send(JSON.stringify(getReturnJSON()));

            output = '';
            i = 0;
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

function getReturnJSON() {
    return DBData;
}
