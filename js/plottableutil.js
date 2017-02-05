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

    Guideline: function(xScale) {
        var guideline = new Plottable.Components.GuideLineLayer(
             Plottable.Components.GuideLineLayer.ORIENTATION_VERTICAL)
             .scale(xScale);
        return guideline;
    },

    OccupancyChart: function (data) {
        var xScale = new Plottable.Scales.Time();
        x_start = [];
        x_end = [];
        for (var i=0; i < data.length; i++) {
            x_start.push(data[i].x);
            x_end.push(data[i].x2);
        }
        x_min = _.min(x_start);
        x_max = _.max(x_end);

        xScale.domain([x_min, x_max]);
        var xAxis = new Plottable.Axes.Time(xScale, "bottom");
        // xAxis.formatter(Plottable.Formatters.multiTime());

        var yScale = PlottableUtil.CategoryScale();
        var yAxis = PlottableUtil.CategoryAxis(yScale, "left");

        var colorScale = ["#FFFFFF", "#FF0000", "#FF00FF", "#FFFF00", "#F0FFF0", "#0FF0FF"];
        var xAccessor = function(d) { return d.x; }
        var x2Accessor = function(d) { return d.x2; }
        var yAccessor = function(d) { return d.y; }
        var colorAccessor = function(d) { return colorScale[d.val]; }

        var dataset = new Plottable.Dataset(data);

        var plot = new Plottable.Plots.Rectangle()
          .addDataset(dataset)
          .x(xAccessor, xScale)
          .x2(x2Accessor, xScale)
          .y(yAccessor, yScale)
          .attr("fill", colorAccessor);

        var guideline = PlottableUtil.Guideline(xScale);

        var click_interaction = new Plottable.Interactions.Click();
        click_interaction.onClick(function(point) {
          var selection = plot.entitiesAt(point)[0].selection;
          selection.attr("fill", "#F99D42");
        });
        click_interaction.attachTo(plot);

        var move_interaction = new Plottable.Interactions.Pointer();
        move_interaction.onPointerMove(function(point) {
            var nearest = plot.entityNearest(point);
            guideline.value(nearest.datum.x);
        });
        move_interaction.attachTo(plot);

        var plots = new Plottable.Components.Group([plot, guideline]);
        var chart = new Plottable.Components.Table([
                          [yAxis, plots],
                          [null,  xAxis]
                        ]);
        return {chart: chart, dataset: dataset};
    },

    GameChart: function (data) {
        var xScale = PlottableUtil.CategoryScale();
        var xAxis = PlottableUtil.CategoryAxis(xScale, "bottom");

        var yScale = PlottableUtil.CategoryScale();
        var yAxis = PlottableUtil.CategoryAxis(yScale, "left");

        var xAccessor = function(d) { return d.desc; }
        var yAccessor = function(d) { return 1; }

        var dataset = new Plottable.Dataset(data);

        var colorScale = ["#FFFFFF", "#FF0000", "#FF00FF", "#FFFF00", "#F0FFF0", "#0FF0FF"];
        var colorAccessor = function(d) { return colorScale[d.id]; }

        var plot = new Plottable.Plots.Rectangle()
          .addDataset(dataset)
          .x(xAccessor, xScale)
          .y(yAccessor, yScale)
          .attr("fill", colorAccessor)
          .attr("stroke", "#fff")
          .attr("stroke-width", 5);

        var interaction = new Plottable.Interactions.Click();
        interaction.onClick(function(point) {
          var selection = plot.entitiesAt(point)[0].selection;
          selection.attr("fill", "#F99D42");
        });
        interaction.attachTo(plot);

        var chart = new Plottable.Components.Table([
                          [yAxis, plot],
                          [null,  xAxis]
                        ]);

        return {chart: chart, dataset: dataset};
    }
};