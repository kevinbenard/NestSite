NestSite
========
My Nest Thermostat Experiments

Usage:
- Server:
    - Need to supply environment variables for the various APIs
        - CON_STRING - Connection string for postgres
        - THERMO_ID - Thermostat ID for the thermostat to retrieve data from
        - NEST_AUTH - Authentication key from Nest
        - WEATHER_KEY - API key from wunderground.com
    $ node ./server.js
- Site:
    $ DEBUG=NestSite ./bin/www

Libraries used: 
    - Express (http://expressjs.com/) as web framework
    - pg (https://github.com/brianc/node-postgres) for postgres DB driver
    - follow-redirects (https://github.com/olalonde/follow-redirects) for HTTP redirects
    - validator.js (https://github.com/chriso/validator.js) for server-side validation
