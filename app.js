var express = require('express');
var cors = require('cors');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var config = require('./config');

var index = require('./routes/index');
var apiMessages = require('./routes/apiMessages');
var api_ts = require('./routes/api-timeseries');
var path = require('path');

var app = express();

app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'jade');
app.set('view engine', 'ejs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
//Catch json parsing error
app.use(function (error, req, res, next) {
  if (error instanceof SyntaxError) {
    var error_to_send = {};
    error_to_send.error = true;
    error_to_send.message = "Invalid JSON received";
    res.status(400);
    res.send(error_to_send);
  }
});
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//Core routes
app.use('/', index);
app.use('/api/messages', apiMessages);
// app.use('/api/storage', api_ts);

//Now load dynamic plugins
for (var i in config.plugins){
  var plugin_path = config.plugins[i];
  var plugin_name = path.basename(plugin_path, ".js");
  var plugin = require(plugin_path);
  console.log("Registering plugin "+plugin_name+" inside route /api/plugins/"+plugin_name);
  app.use('/api/plugins/'+plugin_name, plugin);
}


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'dev') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    // res.render('error', {
    //   message: err.message,
    //   error: err
    // });
    res.json({
      message: err.message,
      error: {}
  });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  // res.render('error', {
  //   message: err.message,
  //   error: {}
  // });
  res.json({
      message: err.message,
      error: {}
  });
});


module.exports = app;
