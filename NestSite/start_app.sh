#!/bin/bash

DEBUG=NestSite
nodemon ./bin/www --watch app.js --watch routes/index.js
