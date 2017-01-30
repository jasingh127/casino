 // Client side code
 var MiscUtil = {
  /**
  Misc Utility constants and methods
  **/
  
  db_server_address: "http://10.0.0.97:3000",

  // Note Const/function below is duplicated on server as well
  N_DAY_CHUNKS: 48, // half hour chunks

  day_chunk_to_hour_min: function(chunk) {
    var hour = Math.floor(chunk*24/MiscUtil.N_DAY_CHUNKS);
    var mins_per_chunk = 60*24/MiscUtil.N_DAY_CHUNKS;
    var mins = chunk*mins_per_chunk - hour*60;
    return {hour: hour, mins: mins};
  }
}