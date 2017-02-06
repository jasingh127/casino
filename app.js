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
var extra_minutes = prev_time_slot.getMinutes() % routes.MINS_PER_DAY_CHUNK;
prev_time_slot = new Date(prev_time_slot.getTime() - extra_minutes*60000) // Round to starting of this day chunk
setInterval(function () {
	var now = new Date();
	if ((now - prev_time_slot)/60/1000 > routes.MINS_PER_DAY_CHUNK) {
	  // Get a list of tables
      var table_ids = [];
      db.all("SELECT * FROM TABLES", 
        function (err, rows) {
        for (var i=0; i < rows.length; i++)
      	  table_ids.push(rows[i]["table_id"]);
        }
      );
      // For all tables, check the status/game from the previous day chunk and update the db
      var year1 = prev_time_slot.getFullYear();
      var month1 = prev_time_slot.getMonth();
      var day1 = prev_time_slot.getDate();
      var day_chunk1 = routes.hour_min_to_day_chunk(prev_time_slot.getHours(), prev_time_slot.getMinutes());
      var dow1 = prev_time_slot.getDay();

      var year2 = now.getFullYear();
      var month2 = now.getMonth();
      var day2 = now.getDate();
      var day_chunk2 = routes.hour_min_to_day_chunk(now.getHours(), now.getMinutes());
      var dow2 = now.getDay();
      for (var i = 0; i < table_ids.length; i++) {
      	db.all("SELECT * FROM OCCUPANCY WHERE table_id = ? AND year = ? AND month = ? \
          AND day = ? AND day_chunk = ? AND dow = ?", table_ids[i], year1, month1, day1, day_chunk1, dow1,
          function (err, rows) {
          	var game_id = 0; // TODO: Implicit empty table = 0, make it explicit
          	if (rows.length == 1) // TODO: length can't be > 1, add assertion during testing
          		game_id = rows[0]["game_id"];
          	// update the db with new entry
          	var query = db.prepare("REPLACE INTO OCCUPANCY VALUES (?, ?, ?, ?, ?, ?, ?)");
            query.run(table_ids[i], game_id, year2, month2, day2, day_chunk2, dow2);
          });
	  }
	  // move prev_time_slot forward by one day chunk
	  prev_time_slot = new Date(prev_time_slot.getTime() + routes.MINS_PER_DAY_CHUNK*60000);
	}
}, 60000);

app.listen(app.get('port'), function(){
  console.log("Casino app listening on port " + app.get('port'));
});