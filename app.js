var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
const dotenv = require("dotenv");
const https = require("https");
const fs = require("fs");

dotenv.config();

// var indexRouter = require('./routes/index');
var catsRouter = require('./routes/CatsApi');
var toysRouter = require('./routes/ToysApi');
var usersRouter = require('./routes/UsersApi');
var externalRouter = require('./routes/ExternalApi');

var app = express();

app.use(cors({
  origin: '*'
}));

// app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// app.use('/', indexRouter);
app.use('/cats', catsRouter);
app.use('/toys', toysRouter);
app.use('/users', usersRouter);
app.use('/external', externalRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

const options = {
  key: fs.readFileSync('./https/key.pem'),
  cert: fs.readFileSync('./https/cert.pem')
};

const server = https.createServer(options, app);
server.listen(4443, () => {
  console.log('HTTPS Server running on port 4443');
});

module.exports = app;
