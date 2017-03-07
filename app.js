// Main Server side application code

/***************************************************************************
// Module dependencies
***************************************************************************/
var express = require('express');
var routes = require('./routes');
var path = require('path');
var sqlite = require('sqlite3').verbose();
fs = require('fs'); // global fs variable
var winston = require('winston')
require('winston-daily-rotate-file');

var app = express();
app.set('port', process.env.PORT || 3000);
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(express.static(__dirname));
var cors = require('cors');
app.use(cors());

/***************************************************************************
// Logger
***************************************************************************/
var logger_directory = path.join(__dirname, 'logs/');
if (!fs.existsSync(logger_directory)){
    fs.mkdirSync(logger_directory);
}

const tsFormat = () => (new Date()).toLocaleTimeString();
var transport = new winston.transports.DailyRotateFile({
  localTime: true,
  json: false,
  timestamp: tsFormat,
  dirname: logger_directory,
  filename: 'log.txt',
  datePattern: 'yyyy-MM-dd_',
  maxFiles: 5,
  prepend: true
});

logger = new (winston.Logger)({ // global logger variable
  transports: [
    transport
  ]
});

/***************************************************************************
// Database
***************************************************************************/
function createDatabase() {
  logger.info('Initializing DB connection...')
  // Create db tables
  db = new sqlite.Database(path.join(__dirname, 'data/casino_tables.db')); // global db variable
}

// Initialize connection to database
createDatabase();

/***************************************************************************
// REST API
***************************************************************************/
app.get('/', routes.index);
app.get('/timetable', routes.timetable);
app.get('/reports', routes.reports);
app.get('/report1', routes.report1);
app.get('/report2', routes.report2);
app.get('/report3', routes.report3);
app.get('/report4', routes.report4);
app.get('/logs', routes.logs);
app.get('/refreshDb', routes.refreshDb);
app.get('/fetchGames', routes.fetchGames)
app.get('/fetchTables', routes.fetchTables)
app.post('/fetchOccupancy', routes.fetchOccupancy);
app.post('/fetchLogs', routes.fetchLogs);
app.post('/fetchWeeklyTableHours', routes.fetchWeeklyTableHours);
app.post('/fetchWeeklyTableHoursSplit', routes.fetchWeeklyTableHoursSplit);
app.post('/insertOccupancy', routes.insertOccupancy);
app.post('/insertTables', routes.insertOccupancy);
app.post('/insertGames', routes.insertOccupancy);

/***************************************************************************
// Periodic DB Update Function
***************************************************************************/
routes.update_occupancy(); // run once immediately, then run periodically

setInterval(function () {
  routes.update_occupancy();

}, 1 * routes.MILLISEC_PER_MIN); // runs every 1 minutes

app.listen(app.get('port'), function(){
  console.log("Casino app listening on port " + app.get('port'));
});
