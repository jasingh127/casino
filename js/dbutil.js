// Client side code
var DbUtil = {
  /**
  Utility methods to fetch and insert data into the sqlite database
  **/

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