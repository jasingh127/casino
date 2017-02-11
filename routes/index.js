// Server side code

/************************************************************************
 Rest API for getting HTML views.
 ************************************************************************/

exports.index = function(req, res){
  res.sendFile('index.html', {root: __dirname + '/../html'});
};

exports.timetable = function(req, res){
  res.sendFile('timetable.html', {root: __dirname + '/../html'});
};


/************************************************************************
 Rest API for Database operations.
 ************************************************************************/

exports.insertOccupancy = function(req, res){
  console.log(req.body)
  var RADIX = 10;
  var table_id = parseInt(req.body.table_id, RADIX);
  var game_id = parseInt(req.body.game_id, RADIX);
  var year = parseInt(req.body.year, RADIX);
  var month = parseInt(req.body.month, RADIX);
  var day = parseInt(req.body.day, RADIX);
  var start_hour = parseInt(req.body.start_hour, RADIX);
  var start_mins = parseInt(req.body.start_mins, RADIX);
  var day_chunk = exports.hour_min_to_day_chunk(start_hour, start_mins);
  var d = new Date(year, month, day);
  var dow = d.getDay();
  var query = db.prepare("REPLACE INTO OCCUPANCY VALUES (?, ?, ?, ?, ?, ?, ?)")
  query.run(table_id, game_id, year, month, day, day_chunk, dow);
  res.json({status: "pass"}) // TODO: Modify this to indicate status of query
};

exports.insertTables = function(req, res){
  // console.log(req.body)
  var table_id = req.body.table_id;
  var table_desc = req.body.table_desc;
  var query = db.prepare("REPLACE INTO TABLES VALUES (?, ?)")
  query.run(table_id, table_desc);
  res.json({status: "pass"}) // TODO: Modify this to indicate status of query
};

exports.insertGames = function(req, res){
  // console.log(req.body)
  var game_id = req.body.game_id;
  var game_desc = req.body.game_desc;
  var query = db.prepare("REPLACE INTO GAMES VALUES (?, ?)")
  query.run(game_id, game_desc);
  res.json({status: "pass"}) // TODO: Modify this to indicate status of query
};

exports.fetchOccupancy = function(req, res){
  // console.log(req.body)
  var year = Number(req.body.year)
  var month = Number(req.body.month)
  var day = Number(req.body.day)

  // call back function used below
  var fetch_available_occupancy = function(year, month, day, table_daychunk_index) {
    db.all("SELECT * FROM OCCUPANCY INNER JOIN TABLES ON OCCUPANCY.table_id = TABLES.table_id \
      WHERE year = ? AND month = ? AND day = ?", year, month, day, 
      function (err, rows) {
        // add hour, mins field as well for convenience
        for (var i = 0; i < rows.length; i++) {
          var table_id = rows[i]["table_id"];
          var day_chunk = rows[i]["day_chunk"];
          var key = table_id + ":" + day_chunk;
          table_daychunk_index[key]["game_id"] = rows[i]["game_id"];
        }
        var all_rows = [];
        for (var key in table_daychunk_index) {
          if (table_daychunk_index.hasOwnProperty(key))
            all_rows.push(table_daychunk_index[key]);
        }
        res.json({"rows": all_rows});
      }
    );
  }

  // First create "blank" entries for ALL tables/day_chunks for this day,
  // then populate with available occupancy data.
  // We need ths because future data for this day is not available but we still 
  // want to show some editable entries for day chunks after current time. 
  db.all("SELECT * FROM TABLES", 
    function (err, rows) {
      var table_daychunk_index = {};
      for (var i = 0; i < rows.length; i++)
        for (var j = 0; j < exports.N_DAY_CHUNKS; j++) {
          var record = {};
          record["table_id"] = rows[i]["table_id"];
          record["game_id"] = exports.BLANK_GAME_ID;  // BLANK ENTRY
          record["year"] = year;
          record["month"] = month;
          record["day"] = day;
          record["day_chunk"] = j;
          record["dow"] = new Date(year, month, day).getDay();
          record["table_desc"] = rows[i]["table_desc"];
          var hour_mins = exports.day_chunk_to_hour_min(record["day_chunk"]);
          record["start_hour"] = hour_mins.start_hour;
          record["start_mins"] = hour_mins.start_mins;
          record["end_hour"] = hour_mins.end_hour;
          record["end_mins"] = hour_mins.end_mins;
          var key = record["table_id"] + ":" + record["day_chunk"];
          table_daychunk_index[key] = record;
        }

      // Overwrite with available occupancy data and return
      fetch_available_occupancy(year, month, day, table_daychunk_index);
    }
  );
};

exports.fetchTables = function(req, res){
  // console.log(req.body)
  db.all("SELECT * FROM TABLES", 
    function (err, rows) {
      res.json({"rows": rows});
    }
  );
};

exports.fetchGames = function(req, res){
  // console.log(req.body)
  db.all("SELECT * FROM GAMES ORDER BY game_id", 
    function (err, rows) {
      res.json({"rows": rows});
    }
  );
};

exports.refreshDb = function(req, res){
  // Create tables and poupulate the DB with dummy data

  db.serialize(function() {
    // ================================================================================
    // Create tables
    // ================================================================================

    // Occupancy table
    var query = "CREATE TABLE IF NOT EXISTS OCCUPANCY (table_id INTEGER, \
                                                       game_id INTEGER, \
                                                       year INTEGER, \
                                                       month INTEGER, \
                                                       day INTEGER, \
                                                       day_chunk INTEGER, \
                                                       dow INTEGER)";
    db.run(query)

    // Occupancy table unique index
    var query = "CREATE UNIQUE INDEX IF NOT EXISTS occupancy_index ON OCCUPANCY(table_id, year, month, day, day_chunk, dow)"
    db.run(query)

    // Games table
    var query = "CREATE TABLE IF NOT EXISTS GAMES (game_id INTEGER, game_desc TEXT)"
    db.run(query)

    // Games table unique index
    var query = "CREATE UNIQUE INDEX IF NOT EXISTS games_index ON GAMES(game_id)"
    db.run(query)

    // Tables table
    var query = "CREATE TABLE IF NOT EXISTS TABLES (table_id INTEGER, table_desc TEXT)"
    db.run(query)

    // Tables table unique index
    var query = "CREATE UNIQUE INDEX IF NOT EXISTS tables_index ON TABLES(table_id)"
    db.run(query)

    // ================================================================================
    // Add table and game data
    // ================================================================================

    var N_TABLES = 10;
    var GAME_DESCS = ["Empty", "21BJ", "DHP", "BAC", "POKER", "3CP", "PGT"]
    var N_GAMES = GAME_DESCS.length - 1;
    
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

    // ================================================================================
    // Insert dummy occupancy data for each day in the duration below
    // ================================================================================

    var start_date = new Date(2017, 0, 1);  
    var now = new Date();
    var now_day_chunk = exports.hour_min_to_day_chunk(now.getHours(), now.getMinutes());
    var game_id = 0;
    var PERSISTENCE_PROB = 0.7;
    var EMPTY_PROB = 0.4;
    var itrs = 0;
    for (var d = start_date; d <= now; d.setDate(d.getDate() + 1)) {
      for (var table_id = 1; table_id <= N_TABLES; table_id++)
        for (var day_chunk = 0; day_chunk < exports.N_DAY_CHUNKS; day_chunk++) {
          if ((d.toDateString() === now.toDateString()) && (day_chunk > now_day_chunk)) 
            break;
          if (Math.random() < PERSISTENCE_PROB)
            game_id = game_id; // do nothing
          else
            if (Math.random() < EMPTY_PROB)
              game_id = 0;
            else
              game_id = exports.random_int(1, N_GAMES)

          var year = d.getFullYear();
          var month = d.getMonth();
          var day = d.getDate();
          var dow = d.getDay();
          var stmt = db.prepare("REPLACE INTO OCCUPANCY VALUES (?, ?, ?, ?, ?, ?, ?)");
          console.log("Inserting: " + [table_id, game_id, year, month, day, day_chunk, dow])
          stmt.run(table_id, game_id, year, month, day, day_chunk, dow);
          itrs++;
        }
    }  
    console.log("Inserted " + itrs + " records");

  });
  
  res.send("Refreshing Db...Wait for few seconds. \n TODO: Fix this message so that it changes to Refreshed"); // TODO: Not good...because we have an async call..
};

/************************************************************************
 Some utility functions + Global variables
 ************************************************************************/
exports.N_DAY_CHUNKS = 2 * 24; // half hour chunks
exports.MINS_PER_DAY_CHUNK = 60 * 24/exports.N_DAY_CHUNKS;
exports.BLANK_GAME_ID = -1; // Different from empty table, blank means missing/no information

exports.day_chunk_to_hour_min = function(chunk) {
  var start_hour = Math.floor(chunk * 24/exports.N_DAY_CHUNKS);
  var end_hour = Math.floor((chunk + 1) * 24/exports.N_DAY_CHUNKS);
  var start_mins = chunk * exports.MINS_PER_DAY_CHUNK - start_hour * 60;
  var end_mins = (chunk + 1) * exports.MINS_PER_DAY_CHUNK - end_hour * 60; // TODO: Check day wrap-around
  return {start_hour: start_hour, start_mins: start_mins, end_hour: end_hour, end_mins: end_mins};
}

exports.hour_min_to_day_chunk = function(hour, mins) {
  var tot_mins = 60 * hour + mins;
  return Math.floor(tot_mins/exports.MINS_PER_DAY_CHUNK);
}

exports.random_int = function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
} 