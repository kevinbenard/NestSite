var http = require('http');
var pg = require('pg');

//var conString = "postgres://postgres:1234@localhost/postgres";
var conString = "postgres://kevin:5433@localhost/kevin";
var output = "";

var server = http.createServer(function(req, res) {

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
        
        // Query new data from nest
        setInterval(function() {
            console.log(new Date() + " Executing loop!");
        }, 300000 ); // 5 mins

        var query = client.query('SELECT json_data FROM nest_data_raw');
        query.on('row', function(row) {
            var out = addOutput(row.page_url);
            out();
            //console.log(row.id);
        });

        // End query
        query.on('end', function() { 
            client.end();
        });

        // Send result
        res.writeHead(200, {'content-type': 'text/plain'});
        res.end('You are visitor number ' + getOutput());
    });
});
server.listen(50002);

function addOutput(text) {
    return function() {
        //console.log("in addOutput: " + text);
        output += "\n" + text;
    }
}

function getOutput() {
    return output;
}
