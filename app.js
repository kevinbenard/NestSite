var http = require('http');
var pg = require('pg');

var conString = "postgres://kevin:5433@localhost/kevin";
var timeInterval = 300000; // 5 mins in milliseconds
var output = '';
var temps = [];
var testJSON = {'devices':{
    'thermostats':{
        'thermo_id':{
            'humidity':40,
                'locale':'en-US',
                'temperature_scale':'C',
                'is_using_emergency_heat':false,
                'has_fan':false,
                'software_version':'4.3.3',
                'has_leaf':false,
                'device_id':'device_id',
                'name':'Living Room',
                'can_heat':true,
                'can_cool':false,
                'hvac_mode':'heat',
                'target_temperature_c':20.5,
                'target_temperature_f':70,
                'target_temperature_high_c':24.0,
                'target_temperature_high_f':75,
                'target_temperature_low_c':20.0,
                'target_temperature_low_f':68,
                'ambient_temperature_c':21.0,
                'ambient_temperature_f':71,
                'away_temperature_high_c':24.0,
                'away_temperature_high_f':76,
                'away_temperature_low_c':19.0,
                'away_temperature_low_f':67,
                'structure_id':'structure_id',
                'fan_timer_active':false,
                'name_long':'Living Room Thermostat',
                'is_online':true,
                'last_connection':'2014-12-20T22:59:30.349Z'}},
        'smoke_co_alarms':{
            'smoke_id':{
                'name':'Upstairs',
                'locale':'en-US',
                'structure_id':'structure_id',
                'software_version':'2.0rc5',
                'device_id':'device_id',
                'name_long':'Upstairs Nest Protect',
                'is_online':true,
                'last_connection':'2014-12-20T22:33:32.318Z',
                'battery_health':'ok',
                'co_alarm_state':'ok',
                'smoke_alarm_state':'ok',
                'ui_color_state':'green',
                'is_manual_test_active':false,
                'last_manual_test_time':'2014-12-20T17:09:25.000Z'}}},
    'structures':{
        'structure_id':{
            'smoke_co_alarms':['smoke_detector_id'],
            'name':'Home',
            'country_code':'CA',
            'postal_code':'postal_code',
            'time_zone':'America/Regina',
            'away':'home',
            'thermostats':['thermo_id'],
            'structure_id':'structure_id'}},
    'metadata':{
        'access_token':'access_code',
        'client_version':1}};

var thermoID = 'thermo_id';
function ExtractJSONFromNest(input,device_type) {
    var data = input.devices[device_type][thermoID];

    if (data) {
        if (device_type === 'thermostats') {
            console.log(data.can_heat);
        } else if (device_type === 'smoke_co_alarms') {
            console.log();
        } else {
            console.log('Error! Incorrect device type!');
        }
    }

    return data;
}

function InsertDBData(conn,input,device_type) {
    if (device_type === 'thermostats') {
        //client.query('INSERT INTO nest_data_raw (json_data) VALUES ($1)', 
        // [JSON.stringify(testJSON)]);
        var last_connection = new Date(input.last_connection);
        // TODO: Find proper fan_timer_active value
        conn.query('INSERT INTO nest_thermo_data (device_id, structure_id, \
         name, name_long, last_connect, is_online, can_cool, can_heat,\
         is_using_emergency_heat, has_fan, fan_timer_active, fan_timer_timeout,\
         has_leaf, temperature_scale, target_temperature_f, target_temperature_c,\
         target_temperature_high_f, target_temperature_high_c,\
         target_temperature_low_f, target_temperature_low_c, \
         away_temperature_high_f, away_temperature_high_c, \
         away_temperature_low_f, away_temperature_low_c, hvac_mode,\
         ambient_temperature_f, ambient_temperature_c, humidity) \
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,\
         $17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28)', 
         [input.device_id,input.structure_id,input.name,input.name_long,
         last_connection, input.is_online,input.can_cool,input.can_heat,
         input.is_using_emergency_heat,input.has_fan,input.fan_timer_active,
         last_connection/*fan_timer_active*/,input.has_leaf,input.temperature_scale,
         input.target_temperature_f,input.target_temperature_c,
         input.target_temperature_high_f,input.target_temperature_high_c,
         input.target_temperature_low_f,input.target_temperature_low_c,
         input.away_temperature_high_f,input.away_temperature_high_c,
         input.away_temperature_low_f, input.away_temperature_low_c,
         input.hvac_mode,input.ambient_temperature_f,
         input.ambient_temperature_c,input.humidity ]);
    } else {

    }
}

var server = http.createServer(function(req, res) {
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
        
        var outJSON = ExtractJSONFromNest(testJSON, 'thermostats');
        //InsertDBData(client,outJSON,'thermostats');
        //ExtractJSONFromNest(testJSON, 'smoke_co_alarms');
        setInterval(function() {
            // Query new data from nest
            // Insert data into DB
            console.log(new Date() + " Executing loop!");
        }, timeInterval ); // 5 mins


        // TODO: Make output less janky (addOutput)
        //var query = client.query('SELECT json_data FROM nest_data_raw');
        var query = client.query('SELECT * FROM nest_thermo_data');
        query.on('row', function(row) {
            //var out = addOutput(row.json_data);
            temps.push(row['ambient_temperature_c']);
            var out = addOutput('ID: ' + row['req_id'] + ' Current temp: ' + row['ambient_temperature_c']);
            out();
        });

        temps.forEach(function(element, index, array) {
            var out2 = addOutput('Index: ' + index + ' Temp: ' + element);
            out2();
        });
        // End query
        query.on('end', function() { 
            client.end();
        });

        // Send result
        res.writeHead(200, {'content-type': 'text/plain'});
        res.end(getOutput());
        output = "";
    });
});
server.listen(50002);

function addOutput(text) {
    return function() {
        output += "\n" + text;
    }
}

function getOutput() {
    return output;
}

