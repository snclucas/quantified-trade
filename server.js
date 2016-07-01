// server.js

// set up ======================================================================
// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.SERVER_PORT;
var mongoose = require('mongoose');
var passport = require('passport');
var flash    = require('connect-flash');

var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var session      = require('express-session');

var configDB = require('./config/database.js');

// configuration ===============================================================
mongoose.connect(configDB.url); // connect to our database

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser.json()); // get information from html forms
app.use(bodyParser.urlencoded({ extended: true }));


//app.use(express.json());       // to support JSON-encoded bodies
//app.use(express.urlencoded()); // to support URL-encoded bodies

app.set('view engine', 'ejs'); // set up ejs for templating

//app.use(express.static('public'));
app.use(express.static(__dirname + '/public'));
//app.use("/public", express.static(__dirname + '/public'));

// required for passport
app.use(session({ secret: process.env.SESSION_SECRET })); // session secret
app.use(passport.initialize());

app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes/routes.js')(app);
require('./app/routes/loginroutes.js')(app, passport); // load our routes and pass in our app and fully configured passport
require('./app/routes/optionsroutes.js')(app);
require('./app/routes/chartroutes.js')(app);
require('./app/routes/symbolroutes.js')(app);

// launch ======================================================================
app.listen(port);
console.log('Server started on port ' + port);

// Export for testing
module.exports = app;
