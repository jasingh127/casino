// Separate node app interface to copy old db into new db

// Module dependencies
path = require('path'); // global path variable
sqlite = require('sqlite3').verbose(); // global sqlite variable
fs = require('fs'); // global fs variable

// Databases
var old_db = new sqlite.Database(path.join(__dirname, 'legacy_data/POKER.db'), sqlite.OPEN_READONLY);
var db = new sqlite.Database(path.join(__dirname, 'data/casino_tables.db'));

// Note that we have hard-coded the number of tables and games, types of games here
var N_TABLES = 11;
var GAME_DESCS = ["Empty", "21BJ", "DHP", "BAC", "POKER", "3CP", "PGT"]
var N_GAMES = GAME_DESCS.length - 1;

// Some other variables
var N_DAY_CHUNKS = 48;
var MINS_PER_DAY_CHUNK = 30;
var MILLISEC_PER_MIN = 60000;

var cutoff_date_str = '2010-01-01 00:00:00';

// Copy all entries after cutoff_date_str from the legacy DB to the new db
populateDb(cutoff_date_str);

// We are done when this program ends.
console.log("Populating DB....")

/***************************************************************************
// Helper Functions Below This
***************************************************************************/

function createDbTables() {
  // Create/reset tables and populate tables/games tables (not occupancy)
  // Warning: Always put in function inside db.serialize() when calling

  // ================================================================================
  // Create tables
  // ================================================================================

  // Occupancy table
  var query = "CREATE TABLE IF NOT EXISTS OCCUPANCY (table_id INTEGER, \
                                                     game_id INTEGER, \
                                                     day_chunk INTEGER, \
                                                     dow INTEGER, \
                                                     time INTEGER)";
  db.run(query)

  // Games table
  var query = "CREATE TABLE IF NOT EXISTS GAMES (game_id INTEGER PRIMARY KEY, game_desc TEXT)"
  db.run(query)

  // Tables table
  var query = "CREATE TABLE IF NOT EXISTS TABLES (table_id INTEGER PRIMARY KEY, table_desc TEXT)"
  db.run(query)

  // ================================================================================
  // Add table and game data
  // ================================================================================
  
  // Delete existing data
  db.run("DELETE FROM OCCUPANCY");
  db.run("DELETE FROM TABLES");
  db.run("DELETE FROM GAMES");

  var stmt = db.prepare("INSERT INTO TABLES VALUES (?, ?)");
  for (var i = 1; i <= N_TABLES; i++) {
      stmt.run(i, "Table " + i);
  }

  var stmt = db.prepare("INSERT INTO GAMES VALUES (?, ?)");
  stmt.run(0, "Empty"); // Game Id 0 is reserved for no game/empty table
  for (var i = 1; i <= N_GAMES; i++) {
      stmt.run(i, GAME_DESCS[i]);
  }

};

function day_chunk_to_hour_min(chunk) {
  var start_hour = Math.floor(chunk * 24/N_DAY_CHUNKS);
  var end_hour = Math.floor((chunk + 1) * 24/N_DAY_CHUNKS);
  var start_mins = chunk * MINS_PER_DAY_CHUNK - start_hour * 60;
  var end_mins = (chunk + 1) * MINS_PER_DAY_CHUNK - end_hour * 60; // TODO: Check day wrap-around
  return {start_hour: start_hour, start_mins: start_mins, end_hour: end_hour, end_mins: end_mins};
}

function hour_min_to_day_chunk(hour, mins) {
  var tot_mins = 60 * hour + mins;
  return Math.floor(tot_mins/MINS_PER_DAY_CHUNK);
}

function random_int(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
} 

function insertDummyOccupancyData() {
  // ================================================================================
  // Insert dummy occupancy data for each day in the duration below
  // ================================================================================
  var start_date = new Date(2017, 1, 20);  
  var now = new Date();
  var now_day_chunk = hour_min_to_day_chunk(now.getHours(), now.getMinutes());
  var game_id = 0;
  var PERSISTENCE_PROB = 0.7;
  var EMPTY_PROB = 0.4;
  var itrs = 0;
  for (var d = start_date; d <= now; d.setDate(d.getDate() + 1)) {
    for (var table_id = 1; table_id <= N_TABLES; table_id++)
      for (var day_chunk = 0; day_chunk < N_DAY_CHUNKS; day_chunk++) {
        if ((d.toDateString() === now.toDateString()) && (day_chunk > now_day_chunk)) {
          break;
        }
        if (Math.random() < PERSISTENCE_PROB) {
          game_id = game_id; // do nothing
        }
        else {
          if (Math.random() < EMPTY_PROB) {
            game_id = 0;
          }
          else {
            game_id = random_int(1, N_GAMES)
          }
        }

        var dow = d.getDay();
        var time = d.getTime() + day_chunk * MINS_PER_DAY_CHUNK * MILLISEC_PER_MIN;
        var stmt = db.prepare("REPLACE INTO OCCUPANCY VALUES (?, ?, ?, ?, ?)");
        stmt.run(table_id, game_id, day_chunk, dow, time);
        itrs++;
      }
  }  

  console.log("Inserted " + itrs + " records");

};

function insertLegacyOccupancyData(start_date_str) {
  // ================================================================================
  // Insert occupancy data for each day in the duration below
  // ================================================================================

  // Read data from old db's TIMES_TABLES table, convert and push into db 
  var TIME_COLS = ["TIME12AM", "TIME1230AM", "TIME1AM", "TIME130AM", "TIME2AM", "TIME230AM", 
                   "TIME3AM", "TIME330AM", "TIME4AM", "TIME430AM", "TIME5AM", "TIME530AM",
                   "TIME6AM", "TIME630AM", "TIME7AM", "TIME730AM", "TIME8AM", "TIME830AM",
                   "TIME9AM", "TIME930AM", "TIME10AM", "TIME1030AM", "TIME11AM", "TIME1130AM",

                   "TIME12PM", "TIME1230PM", "TIME1PM", "TIME130PM", "TIME2PM", "TIME230PM", 
                   "TIME3PM", "TIME330PM", "TIME4PM", "TIME430PM", "TIME5PM", "TIME530PM",
                   "TIME6PM", "TIME630PM", "TIME7PM", "TIME730PM", "TIME8PM", "TIME830PM",
                   "TIME9PM", "TIME930PM", "TIME10PM", "TIME1030PM", "TIME11PM", "TIME1130PM"]

  for (var i = 1; i <= N_TABLES; i++) {
    var table_str = ('0' + i).slice(-2);

    // ****************************************************
    // NOTE TODO BUG FIX: playdate2 is WRONG for the last day, use playdate instead and change the code...
    // ****************************************************
    old_db.each("SELECT * FROM TIMES_TABLES WHERE tbl_num = ? AND playdate2 >= ?", 
      table_str, start_date_str,
      function(err, row) {
        var date_parts = row.PLAY_DATE.split('/');
        var month = parseInt(date_parts[0]) - 1;
        var day = parseInt(date_parts[1]);
        var year = parseInt('20' + date_parts[2]);
        var date = new Date(year, month, day);

        var table_id = parseInt(row.TBL_NUM);

        // go through the TIME*AM columns of this record/row
        for (var j = 0; j < TIME_COLS.length; j++) {
          // Check if the entry is either a valid game or is == "END", in which case, we use "Empty"
          var game_id = GAME_DESCS.indexOf(row[TIME_COLS[j]]);
          if (row[TIME_COLS[j]] == "END") {
            game_id = 0;
          }
          if (game_id < 0) {
            continue;
          }

          var day_chunk = j;
          var dow = date.getDay();
          var time = date.getTime() + day_chunk * MINS_PER_DAY_CHUNK * MILLISEC_PER_MIN;

          var stmt = db.prepare("REPLACE INTO OCCUPANCY VALUES (?, ?, ?, ?, ?)");
          stmt.run(table_id, game_id, day_chunk, dow, time);
        }
    });
  }

};

function populateDb(cutoff_date_str) {
  // Populate the DB with imported data from the legacy database

  console.log('Inside populateDb');
  db.serialize(function() {

    // Create db-tables first
    createDbTables();
    
    db.exec("BEGIN")
    
    // Insert occupancy data now
    insertLegacyOccupancyData(cutoff_date_str);
    // insertDummyOccupancyData();
    
    db.exec("COMMIT")

    // Create a unique index on Occupancy Data to make queries faster
    var query = "CREATE UNIQUE INDEX occupancy_index ON OCCUPANCY(table_id, day_chunk, dow, time)"
    db.run(query)

  });
};

