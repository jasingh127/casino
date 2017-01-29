
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
  // console.log(req.body)
  var table_id = req.body.table_id;
  var game_id = req.body.game_id;
  var year = req.body.year;
  var month = req.body.month;
  var day = req.body.day;
  var day_chunk = req.body.day_chunk;
  var dow = req.body.dow;
  var query = db.prepare("INSERT INTO OCCUPANCY VALUES (?, ?, ?, ?, ?, ?, ?)")
  query.run(table_id, game_id, year, month, day, day_chunk, dow);
};

exports.insertTables = function(req, res){
  // console.log(req.body)
  var table_id = req.body.table_id;
  var table_desc = req.body.table_desc;
  var query = db.prepare("INSERT INTO TABLES VALUES (?, ?)")
  query.run(table_id, table_desc);
};

exports.insertGames = function(req, res){
  // console.log(req.body)
  var game_id = req.body.game_id;
  var game_desc = req.body.game_desc;
  var query = db.prepare("INSERT INTO GAMES VALUES (?, ?)")
  query.run(game_id, game_desc);
};

exports.fetchOccupancy = function(req, res){
  // console.log(req.body)
  var year = Number(req.body.year)
  var month = Number(req.body.month)
  var day = Number(req.body.day)
   db.all("SELECT * FROM OCCUPANCY INNER JOIN TABLES ON OCCUPANCY.table_id = TABLES.table_id \
    WHERE year = ? AND month = ? AND day = ?", year, month, day, 
    function (err, rows) {
      // add hour, mins field as well for convinience
      for (var i = 0; i < rows.length; i++) {
        var hour_mins = exports.day_chunk_to_hour_min(rows[i]["day_chunk"]);
        rows[i]["hour"] = hour_mins.hour;
        rows[i]["mins"] = hour_mins.mins;
      }
      res.json({"rows": rows});
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
  // console.log(req.body)

  db.serialize(function() {
    // Create tables
    var query = "CREATE TABLE IF NOT EXISTS OCCUPANCY (table_id INTEGER, \
                                                       game_id INTEGER, \
                                                       year INTEGER, \
                                                       month INTEGER, \
                                                       day INTEGER, \
                                                       day_chunk INTEGER, \
                                                       dow INTEGER)";
    db.run(query)
    var query = "CREATE TABLE IF NOT EXISTS GAMES (game_id INTEGER, game_desc TEXT)"
    db.run(query)
    var query = "CREATE TABLE IF NOT EXISTS TABLES (table_id INTEGER, table_desc TEXT)"
    db.run(query)

    var N_TABLES = 10;
    var N_GAMES = 6;
    
    // Delete existing data
    db.run("DELETE FROM OCCUPANCY");
    db.run("DELETE FROM TABLES");
    db.run("DELETE FROM GAMES");

    var stmt = db.prepare("INSERT INTO TABLES VALUES (?, ?)");
    for (var i = 0; i < N_TABLES; i++) {
        stmt.run(i, "Table " + i);
    }

    var stmt = db.prepare("INSERT INTO GAMES VALUES (?, ?)");
    stmt.run(0, "Empty"); // Game Id 0 is reserved for no game/empty table
    for (var i = 1; i < N_GAMES; i++) {
        stmt.run(i, "Game " + i);
    }

    // Insert dummy occupancy data for each day in the duration below
    var start_date = new Date(2016, 10, 20);  
    var now = new Date();
    var game_id = 0;
    var PERSISTENCE_PROB = 0.7;
    var itrs = 0;
    for (var d = start_date; d <= now; d.setDate(d.getDate() + 1)) {
      for (var table_id = 0; table_id < N_TABLES; table_id++)
        for (var day_chunk = 0; day_chunk < exports.N_DAY_CHUNKS; day_chunk++) {
          if (Math.random() < PERSISTENCE_PROB)
            game_id = game_id; // do nothing
          else
            game_id = (game_id + 1) % N_GAMES;

          var year = d.getFullYear();
          var month = d.getMonth();
          var day = d.getDate();
          var dow = d.getDay();
          var stmt = db.prepare("INSERT INTO OCCUPANCY VALUES (?, ?, ?, ?, ?, ?, ?)");
          stmt.run(table_id, game_id, year, month, day, day_chunk, dow);
          itrs++;
        }
    }  
    console.log("Inserted " + itrs + " records");

  });
  
  res.send("Refreshing Db..."); // TODO: Not good...because we have an async call..
};

/************************************************************************
 Some utility functions + Global variables
 ************************************************************************/
exports.N_DAY_CHUNKS = 48; // half hour chunks

exports.day_chunk_to_hour_min = function(chunk) {
  var hour = Math.floor(chunk*24/exports.N_DAY_CHUNKS);
  var mins_per_chunk = 60*24/exports.N_DAY_CHUNKS;
  var mins = chunk*mins_per_chunk - hour*60;
  return {hour: hour, mins: mins}
} 