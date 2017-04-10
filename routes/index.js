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

exports.reports = function(req, res){
  res.sendFile('reports.html', {root: __dirname + '/../html'});
};

exports.report1 = function(req, res){
  res.sendFile('report1.html', {root: __dirname + '/../html'});
};

exports.report2 = function(req, res){
  res.sendFile('report2.html', {root: __dirname + '/../html'});
};

exports.report3 = function(req, res){
  res.sendFile('report3.html', {root: __dirname + '/../html'});
};

exports.report4 = function(req, res){
  res.sendFile('report4.html', {root: __dirname + '/../html'});
};

exports.admin = function(req, res){
  res.sendFile('admin.html', {root: __dirname + '/../html'});
};

exports.logs = function(req, res){
  res.sendFile('logs.html', {root: __dirname + '/../html'});
};
/************************************************************************
 Rest API for Database operations.
 ************************************************************************/

exports.insertOccupancy = function(req, res){
  // console.log(req.body)
  var RADIX = 10;
  var table_id = parseInt(req.body.table_id, RADIX);
  var game_id = parseInt(req.body.game_id, RADIX);
  var year = parseInt(req.body.year, RADIX);
  var month = parseInt(req.body.month, RADIX);
  var day = parseInt(req.body.day, RADIX);
  var start_hour = parseInt(req.body.start_hour, RADIX);
  var start_mins = parseInt(req.body.start_mins, RADIX);
  var day_chunk = exports.hour_min_to_day_chunk(start_hour, start_mins);
  var d = new Date(year, month, day, start_hour, start_mins);
  var dow = d.getDay();
  var time = d.getTime();
  var query = db.prepare("REPLACE INTO OCCUPANCY VALUES (?, ?, ?, ?, ?)")
  query.run(table_id, game_id, day_chunk, dow, time);
  logger.info('Added game = ' + game_id + ' in Table ' + table_id + " at " + [year, month, day, day_chunk, dow]);
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

// Fetch occupancy table data for a single day
exports.fetchOccupancy = function(req, res){
  // console.log(req.body)
  var year = Number(req.body.year)
  var month = Number(req.body.month)
  var day = Number(req.body.day)
  var time1 = new Date(year, month, day).getTime();
  var time2 = new Date(year, month, day).getTime() + exports.MILLISEC_PER_DAY - 1;

  // call back function used below
  var fetch_available_occupancy = function(time1, time2, table_daychunk_index) {
    db.all("SELECT * FROM OCCUPANCY INNER JOIN TABLES ON OCCUPANCY.table_id = TABLES.table_id \
      WHERE time BETWEEN ? AND ?", time1, time2, 
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
          record["table_desc"] = rows[i]["table_desc"];
          record["game_id"] = exports.BLANK_GAME_ID;  // BLANK ENTRY
          record["day_chunk"] = j;
          record["dow"] = new Date(year, month, day).getDay();
          var hour_mins = exports.day_chunk_to_hour_min(record["day_chunk"]);
          record["start_hour"] = hour_mins.start_hour;
          record["start_mins"] = hour_mins.start_mins;
          record["end_hour"] = hour_mins.end_hour;
          record["end_mins"] = hour_mins.end_mins;
          record["time"] = new Date(year, month, day, hour_mins.start_hour, hour_mins.start_mins).getTime();
          var key = record["table_id"] + ":" + record["day_chunk"];
          table_daychunk_index[key] = record;
        }

      // Overwrite with available occupancy data and return
      fetch_available_occupancy(time1, time2, table_daychunk_index);
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

exports.fetchWeeklyTableHours = function(req, res){
  // console.log(req.body)
  var year1 = Number(req.body.year1)
  var month1 = Number(req.body.month1)
  var day1 = Number(req.body.day1)

  var year2 = Number(req.body.year2)
  var month2 = Number(req.body.month2)
  var day2 = Number(req.body.day2)

  var time1 = new Date(year1, month1, day1).getTime();
  var time2 = new Date(year2, month2, day2).getTime() + exports.MILLISEC_PER_DAY - 1; // we want day2 all times inclusive

  db.all("SELECT * FROM OCCUPANCY \
    WHERE time BETWEEN ? AND ? \
    AND game_id > 0 ", time1, time2, 
    function (err, rows) {
      var graveyard_tot_hours = [0, 0, 0, 0, 0, 0, 0]; // 7 days of week (dow)
      var day_tot_hours       = [0, 0, 0, 0, 0, 0, 0]; // 7 days of week (dow)
      var swing_tot_hours     = [0, 0, 0, 0, 0, 0, 0]; // 7 days of week (dow)
      var graveyard_avg_hours = [0, 0, 0, 0, 0, 0, 0]; // 7 days of week (dow)
      var day_avg_hours       = [0, 0, 0, 0, 0, 0, 0]; // 7 days of week (dow)
      var swing_avg_hours     = [0, 0, 0, 0, 0, 0, 0]; // 7 days of week (dow)
      // Count number of hours of table play based on chunks accumulated
      for (var i = 0; i < rows.length; i++) {
        var chunk = rows[i]["day_chunk"];
        var dow = rows[i]["dow"];
        if (chunk >= exports.GRAVEYARD_SHIFT_START && chunk < exports.GRAVEYARD_SHIFT_END) {
          graveyard_tot_hours[dow] += 1.0/exports.CHUNKS_PER_HOUR;
          graveyard_avg_hours[dow] += 1.0/(exports.CHUNKS_PER_HOUR * exports.GRAVEYARD_SHIFT_TOT_HOURS);
        }
        else if (chunk >= exports.DAY_SHIFT_START && chunk < exports.DAY_SHIFT_END) {
          day_tot_hours[dow] += 1.0/exports.CHUNKS_PER_HOUR;
          day_avg_hours[dow] += 1.0/(exports.CHUNKS_PER_HOUR * exports.DAY_SHIFT_TOT_HOURS);
        }
        else if (chunk >= exports.SWING_SHIFT_START || chunk < exports.SWING_SHIFT_END) {   // || because (18, 2)
          swing_tot_hours[dow] += 1.0/exports.CHUNKS_PER_HOUR;
          swing_avg_hours[dow] += 1.0/(exports.CHUNKS_PER_HOUR * exports.SWING_SHIFT_TOT_HOURS);
        }
      }
      var result = {graveyard_tot_hours: graveyard_tot_hours, graveyard_avg_hours: graveyard_avg_hours,
                    day_tot_hours: day_tot_hours, day_avg_hours: day_avg_hours, 
                    swing_tot_hours: swing_tot_hours, swing_avg_hours: swing_avg_hours};
      res.json({"result":result});
    }
  );
};

exports.fetchWeeklyTableHoursSplit = function(req, res){
  // console.log(req.body)
  var year1 = Number(req.body.year1)
  var month1 = Number(req.body.month1)
  var day1 = Number(req.body.day1)

  var year2 = Number(req.body.year2)
  var month2 = Number(req.body.month2)
  var day2 = Number(req.body.day2)

  var time1 = new Date(year1, month1, day1).getTime();
  var time2 = new Date(year2, month2, day2).getTime() + exports.MILLISEC_PER_DAY - 1; // we want day2 all times inclusive

  db.all("SELECT * FROM OCCUPANCY INNER JOIN GAMES ON OCCUPANCY.game_id = GAMES.game_id \
    WHERE time BETWEEN ? AND ? \
    AND OCCUPANCY.game_id > 0 ", time1, time2, 
    function (err, rows) {
      var table_game_dict = {};  // indexed by table_id_game_id
      var game_dict = {};  // indexed by game_id
      // Count number of hours of table play based on chunks accumulated (populate the two dicts)
      for (var i = 0; i < rows.length; i++) {
        var key1 = rows[i]["table_id"] + ":" + rows[i]["game_desc"];
        if (!table_game_dict.hasOwnProperty(key1)) { // first appearance of key1, initialize sums
          table_game_dict[key1] = {
            graveyard_tot_hours: [0, 0, 0, 0, 0, 0, 0], // 7 days of week (dow)
            day_tot_hours:       [0, 0, 0, 0, 0, 0, 0], // 7 days of week (dow)
            swing_tot_hours:     [0, 0, 0, 0, 0, 0, 0], // 7 days of week (dow)
          };
        }

        var chunk = rows[i]["day_chunk"];
        var dow = rows[i]["dow"];
        if (chunk >= exports.GRAVEYARD_SHIFT_START && chunk < exports.GRAVEYARD_SHIFT_END) {
          table_game_dict[key1].graveyard_tot_hours[dow] += 1.0/exports.CHUNKS_PER_HOUR;
        }
        else if (chunk >= exports.DAY_SHIFT_START && chunk < exports.DAY_SHIFT_END) {
          table_game_dict[key1].day_tot_hours[dow] += 1.0/exports.CHUNKS_PER_HOUR;
        }
        else if (chunk >= exports.SWING_SHIFT_START || chunk < exports.SWING_SHIFT_END) {   // || because (18, 2)
          table_game_dict[key1].swing_tot_hours[dow] += 1.0/exports.CHUNKS_PER_HOUR;
        }

        var key2 = rows[i]["game_desc"];
        if (!game_dict.hasOwnProperty(key2)) {  // first appearance of key2, initialize sums
          game_dict[key2] = {
            graveyard_tot_hours: [0, 0, 0, 0, 0, 0, 0], // 7 days of week (dow)
            day_tot_hours:       [0, 0, 0, 0, 0, 0, 0], // 7 days of week (dow)
            swing_tot_hours:     [0, 0, 0, 0, 0, 0, 0], // 7 days of week (dow)
          };
        }

        var chunk = rows[i]["day_chunk"];
        var dow = rows[i]["dow"];
        if (chunk >= exports.GRAVEYARD_SHIFT_START && chunk < exports.GRAVEYARD_SHIFT_END) {
          game_dict[key2].graveyard_tot_hours[dow] += 1.0/exports.CHUNKS_PER_HOUR;
        }
        else if (chunk >= exports.DAY_SHIFT_START && chunk < exports.DAY_SHIFT_END) {
          game_dict[key2].day_tot_hours[dow] += 1.0/exports.CHUNKS_PER_HOUR;
        }
        else if (chunk >= exports.SWING_SHIFT_START || chunk < exports.SWING_SHIFT_END) {   // || because (18, 2)
          game_dict[key2].swing_tot_hours[dow] += 1.0/exports.CHUNKS_PER_HOUR;
        }
      }

      var result = {table_game_dict: table_game_dict, game_dict:game_dict};
      res.json({"result":result});
    }
  );
};

exports.fetchWeeklyGameHours = function(req, res){
  // console.log(req.body)
  var year1 = Number(req.body.year1)
  var month1 = Number(req.body.month1)
  var day1 = Number(req.body.day1)

  var year2 = Number(req.body.year2)
  var month2 = Number(req.body.month2)
  var day2 = Number(req.body.day2)

  var time1 = new Date(year1, month1, day1).getTime();
  var time2 = new Date(year2, month2, day2).getTime() + exports.MILLISEC_PER_DAY - 1; // we want day2 all times inclusive

  db.all("SELECT * FROM OCCUPANCY INNER JOIN GAMES ON OCCUPANCY.game_id = GAMES.game_id \
    WHERE time BETWEEN ? AND ? \
    AND OCCUPANCY.game_id > 0 ", time1, time2,
    function (err, rows) {
      var game_dict = {};  // indexed by game_id
      for (var i = 0; i < rows.length; i++) {
        var key = rows[i]["game_desc"];
        var dow = rows[i]["dow"];

        if (!game_dict.hasOwnProperty(key)) {  // first appearance of key, initialize sums
          game_dict[key] = [0, 0, 0, 0, 0, 0, 0]; // 7 days of week (dow)
        }

        game_dict[key][dow] += 1.0/exports.CHUNKS_PER_HOUR;
      }
      var result = {game_dict: game_dict};
      res.json({"result":result});
    }
  );
};

// Fetch log data for a single day
exports.fetchLogs = function(req, res){
  // console.log(req.body)
  var year = Number(req.body.year)
  var month = Number(req.body.month)
  var day = Number(req.body.day)

  var datestring = year + '-' + ('0' + (month+1)).slice(-2) + '-' + ('0' + day).slice(-2);
  var file = datestring + "_log.txt";
  var baseDir = __dirname + '/../logs';

  fs.exists(baseDir + '/' + file, function(exists) {
    if (exists) {
      res.sendFile(file, {root: __dirname + '/../logs'});
    }
    else {
      res.send("No logs exist for " + datestring)
    }
  });
}

/************************************************************************
 Rest API for Print operations.
 ************************************************************************/
exports.print = function(req, res){
  for (var i = 0; i < req.body.records.length; i++) {
    var record = req.body.records[i];
    var event;
    if (parseInt(record.start_stop_flag)) {
      event = " game started ";
    }
    else {
      event = " game ended ";
    }

    exports.printHelper(req.body.date, event, record.table_id, record.game_desc, req.body.time);
    exports.printHelper(req.body.date, event, record.table_id, record.game_desc, req.body.time);

  }
  res.json({status: "pass"}) // TODO: Modify this to indicate status of query
}

exports.printHelper = function(date, event, table_id, game_desc, time){
  printer.clear()
  printer.bold(true);
  printer.alignCenter();
  printer.println("Casino San Pablo");
  printer.println("GAME CARD");
  printer.bold(false);
  printer.println(date);
  printer.drawLine();

  printer.alignLeft();
  printer.println("Section: Cal Side");
  printer.println("Status: " + event);
  printer.println("Table: " + table_id);
  printer.println("Type: " + game_desc);
  printer.println("Time: " + time);
  printer.println("Flr Pers: CALLEAD");
  printer.drawLine();
  printer.cut();
  printer.execute();
}

/************************************************************************
 Some utility functions + Global variables
 ************************************************************************/
exports.CHUNKS_PER_HOUR = 2;
exports.N_DAY_CHUNKS = exports.CHUNKS_PER_HOUR * 24; // half hour chunks
exports.MINS_PER_DAY_CHUNK = 60 / exports.CHUNKS_PER_HOUR;
exports.BLANK_GAME_ID = -1; // Different from empty table, blank means missing/no information

exports.GRAVEYARD_SHIFT_START = 2 * exports.CHUNKS_PER_HOUR; // 2 AM
exports.GRAVEYARD_SHIFT_END = 10 * exports.CHUNKS_PER_HOUR; // 10 AM
exports.GRAVEYARD_SHIFT_TOT_HOURS = 8.0; // 2 AM - 10 AM

exports.DAY_SHIFT_START = 10 * exports.CHUNKS_PER_HOUR; // 10 AM
exports.DAY_SHIFT_END = 18 * exports.CHUNKS_PER_HOUR; // 6 PM
exports.DAY_SHIFT_TOT_HOURS = 8.0; // 10 AM - 6 PM

exports.SWING_SHIFT_START = 18 * exports.CHUNKS_PER_HOUR; // 6 PM
exports.SWING_SHIFT_END = 2 * exports.CHUNKS_PER_HOUR; // 2 AM
exports.SWING_SHIFT_TOT_HOURS = 8.0; // 6 PM - 2 AM

exports.MILLISEC_PER_MIN = 60000;
exports.MILLISEC_PER_DAY = 86400000;

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

/************************************************************************
Function to update the database based on current status of tables

For each table, check if an entry for current day chunk exists in the DB,
if not, then fetch the last exsiting entry and copy it over all the way to 
the current time to fill the gap. Note that we adopt this design over the 
simpler logic of looking at the prev time slot/day_chunk because sometimes 
our process sleeps for a duration much longer than a day chunk.
************************************************************************/
exports.update_occupancy = function() {
  logger.info("Running Update Occupancy Function");
  var now = new Date();
  var year1 = now.getFullYear();
  var month1 = now.getMonth();
  var day1 = now.getDate();
  var day_chunk1 = exports.hour_min_to_day_chunk(now.getHours(), now.getMinutes());
  var hm1 = exports.day_chunk_to_hour_min(day_chunk1);
  var t1 = new Date(year1, month1, day1, hm1.start_hour, hm1.start_mins);

  // Get a list of tables
  db.all("SELECT * FROM TABLES", 
  function (err, rows_tbl) {
    if (rows_tbl === undefined) {
      console.log("Database Empty");
      return;
    }

    // For each table_id, let's fill the gaps
    var MAX_GAP_DAYS = 7; // We only look back this much in time to fill gaps
    var now = new Date();
    var TIME_CUTOFF = now.getTime() - MAX_GAP_DAYS * exports.MILLISEC_PER_DAY;
    for (var i = 0; i < rows_tbl.length; i++) {
      var table_id = rows_tbl[i]["table_id"];
      db.all("SELECT * FROM OCCUPANCY WHERE table_id = ? AND time > ? ORDER BY time DESC LIMIT 5", table_id, TIME_CUTOFF,
        function (err, rows) {
          if (rows === undefined) {
            console.log("No entry for this table within cutoff time");
            return;
          }
          // Go through the entries till we find an entry with time <= cur_time, then fill the gap for that table_id
          // Note that in the above SELECT statement, we are getting back max 5 records, but actuallly just 2 are sufficient.
          // This is because we don't allow the user to modify any records more than one day chunk away in future. 
          for (var j = 0; j < rows.length; j++) {
            var game_id = rows[j]["game_id"];
            var day_chunk2 = rows[j]["day_chunk"];
            var t2 = new Date(rows[j]["time"]);

            if (t2.getTime() > t1.getTime())   // ignoring any future filled chunks
              continue;

            if (t2.getTime() == t1.getTime())  // current chunk is already filled, nothing to do
              break; 

            // last filled chunk before current chunk, copy this till (including) current chunk
            while (t2.getTime() < t1.getTime()) {
              t2 = new Date(t2.getTime() + exports.MINS_PER_DAY_CHUNK * exports.MILLISEC_PER_MIN); // advance by 1 chunk
              day_chunk2 = exports.hour_min_to_day_chunk(t2.getHours(), t2.getMinutes());
              var dow2 = t2.getDay();
              var time2 = t2.getTime();
              var query = db.prepare("REPLACE INTO OCCUPANCY VALUES (?, ?, ?, ?, ?)");
              query.run(rows[j]["table_id"], game_id, day_chunk2, dow2, time2);
              logger.info("t2: " + t2 + ", t1: " + t1);
              logger.info("Copying game = " + game_id + " for table " + rows[j]["table_id"]);
            }
            break; // we filled the gap for this table using the last filled chunk, should quit the inner loop
          } 
        });
    }
  });
}

/************************************************************************
More utility functions + Global variables
************************************************************************/
exports.printer_server_address = '10.0.0.209'
exports.printer_port = 9100

