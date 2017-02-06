 // Client side code
 var MiscUtil = {
  /**
  Misc Utility constants and methods
  **/
  
  db_server_address: "http://10.0.0.97:3000",

  min_max_array: function(data) {
    x_start = [];
    x_end = [];
    for (var i=0; i < data.length; i++) {
      x_start.push(data[i].x);
      x_end.push(data[i].x2);
    }
    x_min = _.min(x_start);
    x_max = _.max(x_end);
    return {x_min: x_min, x_max: x_max};
  }
}