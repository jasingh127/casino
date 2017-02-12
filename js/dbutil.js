// Client side code
var DbUtil = {
  /***************************************************************************
  // Utility methods to fetch and insert data into the sqlite database
  ****************************************************************************/

  insertOccupancy: function (record) {
    $.post(MiscUtil.db_server_address + "/insertOccupancy",
      record,
      function(data, status){console.log(data);});
  },

  insertTables: function (record) {
    $.post(MiscUtil.db_server_address + "/insertTables",
      record,
      function(data, status){console.log(data);});
  },

  insertGames: function (record) {
    $.post(MiscUtil.db_server_address + "/insertGames",
      record,
      function(data, status){console.log(data);});
  },

  // Fetch occupancy table data for a single day
  fetchOccupancy: function (params, callback) {
    $.post(MiscUtil.db_server_address + "/fetchOccupancy", 
      params,
      function(data, status){
        var plot_data = [];
        for (var i=0; i < data["rows"].length; i++) {
          var row = data["rows"][i];
          var record = {
            x:          new Date(row["year"], row["month"], row["day"], row["start_hour"], row["start_mins"]),
            x2:         new Date(row["year"], row["month"], row["day"], row["end_hour"], row["end_mins"]),
            y:          row["table_desc"],
            val:        row["game_id"],

            // Additional params kept just for reuse convenience when sending back db update messages

            year:       row["year"],
            month:      row["month"],
            day:        row["day"],
            start_hour: row["start_hour"],
            start_mins: row["start_mins"],
            end_hour:   row["end_hour"],
            end_mins:   row["end_mins"],
            table_id:   row["table_id"],
          }
          plot_data.push(record);
        }
        callback(plot_data);
      });
  },

  // Fetch weekly table hours data for different shifts
  fetchWeeklyTableHours: function (params, callback) {
    $.post(MiscUtil.db_server_address + "/fetchWeeklyTableHours", 
      params,
      function(data, status){
        var plot_data = [];
        var DAYS_IN_WEEK = 7;
        for (var i=0; i < DAYS_IN_WEEK; i++) {
          var g_tot = data["result"].graveyard_tot_hours;
          var d_tot = data["result"].day_tot_hours;
          var s_tot = data["result"].swing_tot_hours;
          var g_avg = data["result"].graveyard_avg_hours;
          var d_avg = data["result"].day_avg_hours;
          var s_avg = data["result"].swing_avg_hours;
          var record = {
            x: i,
            y1: g_avg[i],
            y2: d_avg[i],
            y3: s_avg[i], 
            t1: g_tot[i],
            t2: d_tot[i],
            t3: s_tot[i]
          }
          plot_data.push(record);
        }
        callback(plot_data);
      });
  },

  fetchGames: function (callback) {
    $.get(MiscUtil.db_server_address + "/fetchGames", 
      function(data, status){
        var game_data = [];
        for (var i=0; i < data["rows"].length; i++) {
          var row = data["rows"][i];
          var record = {
            id:    row["game_id"],
            desc:  row["game_desc"]
          }
          game_data.push(record);
        }
        callback(game_data);
      });
  }
}