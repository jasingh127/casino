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

  // Fetch data for report1
  fetchReport1Data: function (params, callback) {
    $.post(MiscUtil.db_server_address + "/fetchWeeklyTableHours", 
      params,
      function(data, status){
        // var g_tot = data["result"].graveyard_tot_hours;
        // var d_tot = data["result"].day_tot_hours;
        // var s_tot = data["result"].swing_tot_hours;
        var g_avg = data["result"].graveyard_avg_hours;
        var d_avg = data["result"].day_avg_hours;
        var s_avg = data["result"].swing_avg_hours;
        var plot_data = {g_avg:g_avg, d_avg:d_avg, s_avg:s_avg};
        callback(plot_data);
      });
  },

  // Fetch data for report2
  fetchReport2Data: function (params, callback) {
    $.post(MiscUtil.db_server_address + "/fetchWeeklyTableHours", 
      params,
      function(data, status){
        var tbl_data = [];
        var g_tot = data["result"].graveyard_tot_hours;
        var d_tot = data["result"].day_tot_hours;
        var s_tot = data["result"].swing_tot_hours;
        var g_avg = data["result"].graveyard_avg_hours;
        var d_avg = data["result"].day_avg_hours;
        var s_avg = data["result"].swing_avg_hours;
        var DAYS_IN_WEEK = 7;
        var DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        for (var i=0; i < DAYS_IN_WEEK; i++) {
          var record = [
            DAY_NAMES[i],
            g_avg[i].toFixed(1),
            g_tot[i].toFixed(1),
            d_avg[i].toFixed(1),
            d_tot[i].toFixed(1),
            s_avg[i].toFixed(1), 
            s_tot[i].toFixed(1),
            ((g_avg[i] + d_avg[i] + s_avg[i])/3).toFixed(2),
            (g_tot[i] + d_tot[i] + s_tot[i]).toFixed(1)
          ]
          tbl_data.push(record);
        }
        callback(tbl_data);
      });
  },

  // Fetch data for report3
  fetchReport3Data: function (params, callback) {
    $.post(MiscUtil.db_server_address + "/fetchWeeklyTableHoursSplit", 
      params,
      function(data, status){
        var tbl_data = [];
        for (var key in data["result"].table_game_dict) {
          var record = [key.split(":")[1], key.split(":")[0]]; // game id and table id
          var DAYS_IN_WEEK = 7;
          var DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
          for (var i=0; i < DAYS_IN_WEEK; i++) {
            var g_tot = data["result"].table_game_dict[key].graveyard_tot_hours;
            var d_tot = data["result"].table_game_dict[key].day_tot_hours;
            var s_tot = data["result"].table_game_dict[key].swing_tot_hours;
            record.push(g_tot[i] > 0.0 ? g_tot[i].toFixed(1): "");
            record.push(d_tot[i] > 0.0 ? d_tot[i].toFixed(1): "");
            record.push(s_tot[i] > 0.0 ? s_tot[i].toFixed(1): "");
            record.push((g_tot[i] + d_tot[i] + s_tot[i]) > 0.0 ? (g_tot[i] + d_tot[i] + s_tot[i]).toFixed(1): "");
          }
          tbl_data.push(record);
        }
        callback(tbl_data);
      });
  },

  // Fetch data for report4
  fetchReport4Data: function (params, callback) {
    $.post(MiscUtil.db_server_address + "/fetchWeeklyGameHours", 
      params,
      function(data, status){
        var plot_data = data["result"].game_dict;
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