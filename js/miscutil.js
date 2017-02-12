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

  date_to_str: function(today) {
    var year = today.getFullYear();
    var month = today.getMonth();
    var day = today.getDate();
    var day_names = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    var month_names = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", 
      "November", "December"];
    var date_str = day_names[today.getDay()] + ", " + today.getDate() + " " + month_names[today.getMonth()] 
      + ", " + today.getFullYear()
    return date_str
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
          var offsets = $("#datepicker").offset();
          var h = $("#datepicker").outerHeight();
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
  }
}