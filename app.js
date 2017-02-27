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
const tsFormat = () => (new Date()).toLocaleTimeString();
var transport = new winston.transports.DailyRotateFile({
  localTime: true,
  json: false,
  timestamp: tsFormat,
  dirname: path.join(__dirname, 'logs/'),
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

// Add routes
app.get('/', routes.index);
app.get('/timetable', routes.timetable);
app.get('/reports', routes.reports);
app.get('/logs', routes.logs);
app.get('/refreshDb', routes.refreshDb);
app.get('/fetchGames', routes.fetchGames)
app.get('/fetchTables', routes.fetchTables)
app.post('/fetchOccupancy', routes.fetchOccupancy);
app.post('/fetchLogs', routes.fetchLogs);
app.post('/fetchWeeklyTableHours', routes.fetchWeeklyTableHours);
app.post('/insertOccupancy', routes.insertOccupancy);
app.post('/insertTables', routes.insertOccupancy);
app.post('/insertGames', routes.insertOccupancy);

var MILLISEC_PER_MIN = 60000;
/************************************************************************
Periodic function to update the database based on current status of tables

For each table, check if an entry for current day chunk exists in the DB,
if not, then fetch the last exsiting entry and copy it over all the way to 
the current time to fill the gap. Note that we adopt this design over the 
simpler logic of looking at the prev time slot/day_chunk because sometimes 
our process sleeps for a duration much longer than a day chunk.
************************************************************************/
var update_occupancy = function() {
  logger.info("Running Periodic Update Occupancy Function");
  var now = new Date();
  var year1 = now.getFullYear();
  var month1 = now.getMonth();
  var day1 = now.getDate();
  var day_chunk1 = routes.hour_min_to_day_chunk(now.getHours(), now.getMinutes());

  // Get a list of tables
  db.all("SELECT * FROM TABLES", 
  function (err_tbl, rows_tbl) {
    // For each table_id, let's fill the gaps
    for (var i = 0; i < rows_tbl.length; i++) {
      var table_id = rows_tbl[i]["table_id"];
      db.all("SELECT * FROM OCCUPANCY WHERE table_id = ? ORDER BY year DESC, month DESC, day DESC, day_chunk DESC LIMIT 5", table_id,
        function (err, rows) {
          // Go through the entries till we find an entry with time <= cur_time, then fill the gap for that table_id
          for (var j = 0; j < rows.length; j++) {
            var year2 = rows[j]["year"];
            var month2 = rows[j]["month"];
            var day2 = rows[j]["day"];
            var day_chunk2 = rows[j]["day_chunk"];
            var game_id = rows[j]["game_id"];

            var hm1 = routes.day_chunk_to_hour_min(day_chunk1);
            var t1 = new Date(year1, month1, day1, hm1.start_hour, hm1.start_mins);
            var hm2 = routes.day_chunk_to_hour_min(day_chunk2);
            var t2 = new Date(year2, month2, day2, hm2.start_hour, hm2.start_mins);
            
            if (t2.getTime() > t1.getTime())   // ignoring any future filled chunks
              continue;

            if (t2.getTime() == t1.getTime())  // current chunk is already filled, nothing to do
              break; 

            // last filled chunk before current chunk, copy this till (including) current chunk
            while (t2.getTime() < t1.getTime()) {
              t2 = new Date(t2.getTime() + routes.MINS_PER_DAY_CHUNK * MILLISEC_PER_MIN); // advance by 1 chunk
              year2 = t2.getFullYear();
              month2 = t2.getMonth();
              day2 = t2.getDate();
              day_chunk2 = routes.hour_min_to_day_chunk(t2.getHours(), t2.getMinutes());
              var dow2 = t2.getDay();
              var query = db.prepare("REPLACE INTO OCCUPANCY VALUES (?, ?, ?, ?, ?, ?, ?)");
              query.run(rows[j]["table_id"], game_id, year2, month2, day2, day_chunk2, dow2);
              logger.info("t2: " + t2 + ", t1: " + t1);
              logger.info("Copying game = " + game_id + " for table " + rows[j]["table_id"]);
            }
            break; // we filled the gap for this table using the last filled chunk, should quit the inner loop
          } 
        });
    }
  });
}

setInterval(function () {
  update_occupancy();

}, 1 * MILLISEC_PER_MIN);

app.listen(app.get('port'), function(){
  console.log("Casino app listening on port " + app.get('port'));
});
