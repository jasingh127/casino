 // Client side code
 var MiscUtil = {
  /**
  Misc Utility constants and methods
  **/
  
  db_server_address: "http://10.0.0.97:3000",

  array_bounds: function(data) {
    x_start = [];
    x_end = [];
    for (var i=0; i < data.length; i++) {
      x_start.push(data[i].x);
      x_end.push(data[i].x2);
    }
    x_min = _.min(x_start);
    x_max = _.max(x_end);
    return {min: x_min, max: x_max};
  },

  date_to_str: function(date) {
    var year = date.getFullYear();
    var month = date.getMonth();
    var day = date.getDate();
    var day_names = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    var month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", 
      "November", "December"];
    var date_str = day_names[date.getDay()] + ", " + date.getDate() + " " + month_names[date.getMonth()] 
      + ", " + date.getFullYear()
    return date_str
  },

  date_to_hours_mins_str: function(date) {
    var hours = date.getHours();
    var mins = date.getMinutes();
    if (hours > 12) {
      return (hours - 12) + ":" + ('0' + mins).slice(-2) + " PM";
    }
    return hours + ":" + ('0' + mins).slice(-2) + "AM" 
  },

  date_picker_helper: function(element_id, on_select_callback) {
    $(element_id).datepicker({
      dateFormat: "DD, d MM, yy",
      showOtherMonths: true,
      selectOtherMonths: true,
      autoclose: true,
      changeMonth: true,
      changeYear: true,
      beforeShow: function (input, inst) {
        setTimeout(function () {
          var offsets = $(element_id).offset();
          var h = $(element_id).outerHeight();
          inst.dpDiv.css({
            top: offsets.top + h,
            left: offsets.left
          });
        },0);
      },
      onSelect: function(dateText) {
        var date = $(this).datepicker('getDate');
        on_select_callback(date);
      }      
    });
  },

  game_start_stop_handler: function(table_id, game_desc, start_stop_flag) {
    var now = Date();
    var event;
    if (start_stop_flag) {
      event = " started ";
    }
    else {
      event = " stopped ";
    }
    console.log("A game of " + game_desc + " was" + event + "on Table " + table_id + " at " + now);
  }
}