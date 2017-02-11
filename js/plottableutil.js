// Client side code
var PlottableUtil = {

    TimeScale: function() {
        return new Plottable.Scales.Time();
    },

    LinearScale: function() {
        return new Plottable.Scales.Linear();
    },

    CategoryScale: function() {
        return new Plottable.Scales.Category();
    },

    TimeAxis: function (timeScale, location) {
        return new Plottable.Axes.Time(timeScale, location);
    },

    NumericAxis: function(linearScale, location) {
        return new Plottable.Axes.Numeric(linearScale, location);
    },

    CategoryAxis: function (categoryScale, location) {
        return new Plottable.Axes.Category(categoryScale, location);
    },

    LinePlot: function(dataset, xAccessor, yAccessor, xScale, yScale, lineColor, strokeWidth) {
        var linePlot = new Plottable.Plots.Line()
            .addDataset(dataset)
            .x(xAccessor, xScale)
            .y(yAccessor, yScale)
            .attr("stroke", lineColor === null ? "#ffff00" : lineColor)
            .attr("stroke-width", strokeWidth === null ? 3 : strokeWidth);
        return linePlot;
    },

    ScatterPlot: function(dataset, xAccessor, yAccessor, xScale, yScale, lineColor, symbolSize) {
        var scatterPlot = new Plottable.Plots.Scatter()
            .addDataset(dataset)
            .x(xAccessor, xScale)
            .y(yAccessor, yScale)
            .attr("stroke", lineColor === null ? "#ffffff" : lineColor)
            .attr("fill", lineColor === null ? "#ffffff" : lineColor)
            .attr("opacity", 1)
            .attr("stroke-width", 1)
            .size(symbolSize === null ? 3 : symbolSize);
        return scatterPlot;

    },

    OccupancyChart: function (shared_data) {
        // xScale
        var xScale = new Plottable.Scales.Time();
        var data = shared_data.occupancy_raw_data;
        if (data.length > 0) {
          var x_bounds = MiscUtil.array_bounds(data);
          xScale.domain([x_bounds.min, x_bounds.max]);
        };

        // xAxis
        var xAxis = new Plottable.Axes.Time(xScale, "bottom")
          .margin(5)
          .annotationsEnabled(true)
          .annotationFormatter(function(d) { return d.toLocaleTimeString() });

        // yScale and yAxis
        var yScale = PlottableUtil.CategoryScale();
        var yAxis = PlottableUtil.CategoryAxis(yScale, "left");

        var colorScale = shared_data.game_color_scale;
        var xAccessor = function(d) { return d.x; }
        var x2Accessor = function(d) { return d.x2; }
        var yAccessor = function(d) { return d.y; }
        var colorAccessor = function(d) { 
          if (_.isUndefined(colorScale[d.val])) 
            return shared_data.color_undefined;
          return colorScale[d.val]; 
        }

        var dataset = new Plottable.Dataset(data);

        // Main rectangle plot
        var plot = new Plottable.Plots.Rectangle()
          .addDataset(dataset)
          .x(xAccessor, xScale)
          .x2(x2Accessor, xScale)
          .y(yAccessor, yScale)
          .attr("fill", colorAccessor)
          .attr("stroke", "black")
          .attr("stroke-width", 0.5);

        // Guideline to show current time
        var now_date_time = new Date();
        var guideline = new Plottable.Components.GuideLineLayer("vertical")
          .scale(xScale)
          .value(now_date_time);
        xAxis.annotatedTicks([now_date_time]);

        // Mouse click interactions
        var click_interaction = new Plottable.Interactions.Click();
        click_interaction.onClick(function(point) {
            var entity = plot.entitiesAt(point);
            if (entity) {
              var record = entity[0].datum;
              if (shared_data.picked_game >= 0) {
                
                // Modify the raw occupancy data and refresh the occupancy chart
                // First we need to search the raw occupancy data to find the correct record
                var matches = $.grep(shared_data.occupancy_raw_data, 
                    function(e){ return (e.x === record.x && e.x2 === record.x2 && e.y === record.y); });
                var match = matches[0]; // has to be a single match
                match.val = shared_data.picked_game;
                PlottableUtil.refreshOccupancyChart(shared_data);
                
                // Convert matched record format and send update request to DB
                var db_update_record = {
                    "table_id":    match.table_id,
                    "game_id":     match.val,
                    "year":        match.year,
                    "month":       match.month,
                    "day":         match.day,
                    "start_hour":  match.start_hour,
                    "start_mins":  match.start_mins,
                    "end_hour":    match.end_hour,
                    "end_mins":    match.end_mins
                };
                // console.log(db_update_record);
                DbUtil.insertOccupancy(db_update_record);
              };
            };
        });
        click_interaction.attachTo(plot);

        // Mouse hover interactions
        var move_interaction = new Plottable.Interactions.Pointer();
        move_interaction.onPointerMove(function(point) {
            var closest = plot.entityNearest(point);
        });
        move_interaction.onPointerExit(function(point) {
        });
        move_interaction.attachTo(plot);

        var plots = new Plottable.Components.Group([plot, guideline]);
        var chart = new Plottable.Components.Table([
                          [yAxis, plots],
                          [null,  xAxis]
                        ]);

        // pan/zoom
        // var panZoom = new Plottable.Interactions.PanZoom(xScale, null);
        // panZoom.attachTo(plots);

        // Update shared_data
        shared_data.occupancy_chart = chart;
        shared_data.occupancy_chart_dataset = dataset;
        shared_data.occupancy_chart_xScale = xScale;
    },

    refreshOccupancyChart: function (shared_data) {
        // raw data changed, so refresh dataset and xScale domain
        shared_data.occupancy_chart_dataset.data(shared_data.occupancy_raw_data);

        var xScale = shared_data.occupancy_chart_xScale;
        var data = shared_data.occupancy_raw_data;
        if (data.length > 0) {
          var x_bounds = MiscUtil.array_bounds(data);
          xScale.domain([x_bounds.min, x_bounds.max]);
        };
        $(window).scrollLeft(timetable_data.prev_scroll_val);
    },

    GameChart: function (shared_data) {
        var xScale = PlottableUtil.CategoryScale();
        var xAxis = PlottableUtil.CategoryAxis(xScale, "bottom");

        var yScale = PlottableUtil.CategoryScale();
        var yAxis = PlottableUtil.CategoryAxis(yScale, "left");

        var xAccessor = function(d) { return d.desc; }
        var yAccessor = function(d) { return 1; }

        var data = shared_data.game_raw_data;
        var dataset = new Plottable.Dataset(data);

        var colorScale = shared_data.game_color_scale;
        var colorAccessor = function(d) { return colorScale[d.id]; }

        var plot = new Plottable.Plots.Rectangle()
          .addDataset(dataset)
          .x(xAccessor, xScale)
          .y(yAccessor, yScale)
          .attr("fill", colorAccessor)
          .attr("stroke", "#fff")
          .attr("stroke-width", 5);

        var highlighter = new Plottable.Plots.Rectangle()
          .addDataset(dataset)
          .x(xAccessor, xScale)
          .y(yAccessor, yScale)
          .attr("fill", "black")
          .attr("fill-opacity", 0);

        var interaction = new Plottable.Interactions.Click();
        interaction.onClick(function(point) {
          shared_data.picked_game = plot.entitiesAt(point)[0].datum.id; // Update shared_data
          var nearest = highlighter.entityNearest(point);
          highlighter.entities().forEach(function(entity) {
                entity.selection.attr("fill-opacity", 0);
          });
          nearest.selection.attr("fill-opacity", 0.3);
        });
        interaction.attachTo(plot);

        var plots = new Plottable.Components.Group([xAxis, highlighter]);
        var chart = new Plottable.Components.Table([
                          [yAxis, plot],
                          [null,  plots]
                        ]);

        // Update shared_data
        shared_data.game_chart = chart;
    }
};