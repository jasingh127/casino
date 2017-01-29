
var DbUtil = {
  /**
  Utility methods to fetch and insert data into the sqlite database
  **/

  db_server_address: "http://10.0.0.97:3000",

  insertOccupancy: function (record) {
    $.post(DbUtil.db_server_address + "/insertOccupancy",
      JSON.stringify(record),
      function(data, status){alert(data);});
  },

  insertTables: function (record) {
    $.post(DbUtil.db_server_address + "insertTables",
      JSON.stringify(record),
      function(data, status){alert(data);});
  },

  insertGames: function (record) {
    $.post(DbUtil.db_server_address + "insertGames",
      JSON.stringify(record),
      function(data, status){alert(data);});
  },

  fetchOccupancy: function (params, callback) {
    $.post(DbUtil.db_server_address + "/fetchOccupancy", 
      params,
      function(data, status){
        var plot_data = [];
        for (var i=0; i < data["rows"].length; i++) {
          var row = data["rows"][i];
          var record = {
            x:    new Date(row["year"], row["month"], row["day"], row["hour"], row["mins"]),
            x1:   row["day_chunk"],
            y:    row["table_desc"],
            val:  row["game_id"]
          }
          plot_data.push(record);
        }
        callback(plot_data);
      });
  },

  fetchGames: function (callback) {
    $.get(DbUtil.db_server_address + "/fetchGames", 
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