var http = require('http');
    https = require('follow-redirects').https;
    pg = require('pg');
    fs = require('fs');

var conString = process.env.CON_STRING;
var thermoID = process.env.THERMO_ID;
var weather_key = process.env.WEATHER_KEY;
var nest_auth = process.env.NEST_AUTH;
var timeInterval = 300000; // 5 mins in milliseconds
//var timeInterval = 30000; // 30 seconds in milliseconds

function GetDataFromNest(DBCon) {
    https.get('https://developer-api.nest.com/?auth=' + nest_auth, function(res) {
        if (res.statusCode != '200') {
            console.log('Error retrieving data!: Code: ' + res.statusCode);
            return;
        }
        res.on('data', function(data) {
            var out = ExtractJSON(data, 'thermostats');
            if (out) {
                InsertDBData(DBCon, out, 'thermostats');
            } else {
                console.log('Parse error on JSON extraction');
            }
        });
    }).on('error', function(error) {
        console.log('ERROR: \n' + error);
    });
}

function ExtractJSON(input,input_type) {
    if(input) {
        var data = JSON.parse(input);
    } else {
        return null;
    }

    if (data) {
        if (input_type === 'thermostats') {
            var out = data.devices.thermostats[thermoID];
        } else if (input_type === 'smoke_co_alarms') {
            var out = data.devices.smoke_co_alarms[0/*alarm_id*/];
        } else if (input_type === 'weather') {
            var out = data.current_observation;
        } else {
            console.log('Error! Incorrect device type!');
        }
    }

    return out;
}

function InsertDBData(conn,input,device_type) {
    var curr_time = new Date();

    if (!conn || !input) { return; }
    if (device_type === 'thermostats') {
        var last_connection = new Date(input.last_connection);
        var fan_timer_timeout = null;
        if (input.fan_timer_timeout) {
            fan_timer_timeout = new Date(input.fan_timer_timeout);
        }
        conn.query('INSERT INTO nest_data_raw (json_data,curr_time) VALUES ($1,$2)', 
            [JSON.stringify(input), curr_time]);
        conn.query('INSERT INTO nest_thermo_data (device_id, structure_id, \
         name, name_long, last_connect, is_online, can_cool, can_heat,\
         is_using_emergency_heat, has_fan, fan_timer_active, fan_timer_timeout,\
         has_leaf, temperature_scale, target_temperature_f, target_temperature_c,\
         target_temperature_high_f, target_temperature_high_c,\
         target_temperature_low_f, target_temperature_low_c, \
         away_temperature_high_f, away_temperature_high_c, \
         away_temperature_low_f, away_temperature_low_c, hvac_mode,\
         ambient_temperature_f, ambient_temperature_c, humidity, curr_time) \
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,\
         $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28, $29)', 
         [input.device_id,input.structure_id,input.name,input.name_long,
         last_connection, input.is_online,input.can_cool,input.can_heat,
         input.is_using_emergency_heat,input.has_fan,input.fan_timer_active,
         fan_timer_timeout,input.has_leaf,input.temperature_scale,
         input.target_temperature_f,input.target_temperature_c,
         input.target_temperature_high_f,input.target_temperature_high_c,
         input.target_temperature_low_f,input.target_temperature_low_c,
         input.away_temperature_high_f,input.away_temperature_high_c,
         input.away_temperature_low_f, input.away_temperature_low_c,
         input.hvac_mode,input.ambient_temperature_f,
         input.ambient_temperature_c,input.humidity, curr_time ]);
    } else if (device_type === 'weather') {
        var relhumidity = input.relative_humidity.substring(0, 
                                        input.relative_humidity.length - 1);
        conn.query('INSERT INTO weather_data_raw (wjson_data,curr_time) \
                   VALUES ($1,$2)', [JSON.stringify(input), curr_time]);
        conn.query('INSERT INTO weather_thermo_data (curr_time,weather,\
            temp_f, temp_c, humidity, wind_kph, pressure_mb,\
            dewpoint_c,dewpoint_f,windchill_f,windchill_c,\
            precip_today_metric) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,\
            $9,$10,$11,$12)',
            [curr_time,input.weather,input.temp_f,input.temp_c,
            relhumidity,input.wind_kph, input.pressure_mb,
            input.dewpoint_c,input.dewpoint_f,input.windchill_f,
            input.windchill_c,input.precip_today_metric]);
    } else {
        return;
    }
    conn.query('COMMIT');
}

function GetWeatherData(DBCon) {
    http.get('http://api.wunderground.com/api/' + weather_key + '/geolookup/conditions/q/Canada/Saskatoon.json', function(res) {
        if (res.statusCode != '200') {
            console.log('Error retrieving weather!: Code: ' + res.statusCode);
            return;
        }
        res.on('data', function(data) {
            var out = ExtractJSON(data,'weather');
            if (out) {
                InsertDBData(DBCon, out, 'weather');
            } else {
                console.log('Parse error on JSON extraction');
            }
        });
    }).on('error', function(error) {
        console.log('ERROR: \n' + error);
    });
}

// get a pg client from the connection pool
pg.connect(conString, function(err, client, done) {
    var handleError = function(err) {
        // no error occurred, continue with the request
        if(!err) return false;

        done(client);
        res.writeHead(500, {'content-type': 'text/plain'});
        res.end('An error occurred: ' + err);
        return true;
    };

    console.log('Starting...\n');
    setInterval(function() {
        GetDataFromNest(client);
        GetWeatherData(client);

        console.log(new Date() + " Executing loop!");
    }, timeInterval ); // 5 mins
});
