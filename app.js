// Main Server side application code

// Module dependencies
var express = require('express');
var routes = require('./routes');
var path = require('path');
var sqlite = require('sqlite3').verbose();
var fs = require('fs');

var app = express();
app.set('port', process.env.PORT || 3000);
var bodyParser = require('body-parser');
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
app.use(express.static(__dirname));
var cors = require('cors');
app.use(cors());

function createDatabase() {
  console.log("Initializing DB connection...")
  // Create db tables
  db = new sqlite.Database(path.join(__dirname, 'data/sample.db'));
}

// Initialize connection to database
createDatabase();

// Add routes
app.get('/', routes.index);
app.get('/timetable', routes.timetable);
app.get('/refreshDb', routes.refreshDb);
app.get('/fetchGames', routes.fetchGames)
app.get('/fetchTables', routes.fetchTables)
app.post('/fetchOccupancy', routes.fetchOccupancy);
app.post('/insertOccupancy', routes.insertOccupancy);
app.post('/insertTables', routes.insertOccupancy);
app.post('/insertGames', routes.insertOccupancy);

// Periodic function to update the database based on current status of tables
var prev_time_slot = new Date();
var MILLISEC_PER_MIN = 60000;

var coeff = 1000 * 60 * routes.MINS_PER_DAY_CHUNK;
var prev_time_slot = new Date(Math.floor(prev_time_slot.getTime()/coeff)*coeff); // Round to starting of this day chunk

var update_occupancy = function(t1, t2) {
  // For all tables, check the status/game from the previous day chunk and update the db
  var year1 = t1.getFullYear();
  var month1 = t1.getMonth();
  var day1 = t1.getDate();
  var day_chunk1 = routes.hour_min_to_day_chunk(t1.getHours(), t1.getMinutes());
  var dow1 = t1.getDay();

  var year2 = t2.getFullYear();
  var month2 = t2.getMonth();
  var day2 = t2.getDate();
  var day_chunk2 = routes.hour_min_to_day_chunk(t2.getHours(), t2.getMinutes());
  var dow2 = t2.getDay();

  var filled_table_ids = [];
  db.all("SELECT * FROM OCCUPANCY WHERE year = ? AND month = ? AND day = ? \
    AND day_chunk = ? AND dow = ?", year2, month2, day2, day_chunk2, dow2,
    function (err, rows) {
      for (var i = 0; i < rows.length; i++)
        filled_table_ids.push(rows[i]["table_id"]);
    });

  db.all("SELECT * FROM OCCUPANCY WHERE year = ? AND month = ? AND day = ? \
    AND day_chunk = ? AND dow = ?", year1, month1, day1, day_chunk1, dow1,
    function (err, rows) {
      for (var i = 0; i < rows.length; i++) {
        // update the db with new entry
        var table_id = rows[i]["table_id"];
        if (filled_table_ids.indexOf(table_id) < 0) {
          var query = db.prepare("REPLACE INTO OCCUPANCY VALUES (?, ?, ?, ?, ?, ?, ?)");
          query.run(table_id, rows[i]["game_id"], year2, month2, day2, day_chunk2, dow2);   
        }
      }
    });
}

setInterval(function () {
	var now = new Date();
	if ((now - prev_time_slot)/MILLISEC_PER_MIN > routes.MINS_PER_DAY_CHUNK) {
    update_occupancy(prev_time_slot, now);

	  // move prev_time_slot forward by one day chunk
	  prev_time_slot = new Date(prev_time_slot.getTime() + routes.MINS_PER_DAY_CHUNK*MILLISEC_PER_MIN);
  }
}, 1 * MILLISEC_PER_MIN);

app.listen(app.get('port'), function(){
  console.log("Casino app listening on port " + app.get('port'));
});
