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
        var linePlot = new Plottable.Plots.Line();
        linePlot.addDataset(dataset);
        linePlot.x(xAccessor, xScale)
        linePlot.y(yAccessor, yScale);
        linePlot.attr("stroke", lineColor === null ? "#ffffff" : lineColor);
        linePlot.attr("stroke-width", strokeWidth === null ? 3 : strokeWidth);
        return linePlot;
    },

    ScatterPlot: function(dataset, xAccessor, yAccessor, xScale, yScale, lineColor, symbolSize) {
        var scatterPlot = new Plottable.Plots.Scatter();
        scatterPlot.addDataset(dataset)
            .x(xAccessor, xScale)
            .y(yAccessor, yScale)
            .attr("stroke", lineColor === null ? "#ffffff" : lineColor)
            .attr("fill", lineColor === null ? "#ffffff" : lineColor)
            .attr("opacity", 1)
            .attr("stroke-width", 1)
            .size(symbolSize === null ? 3 : symbolSize);
        return scatterPlot;

    },

    RectPlot: function(dataset, xAccessor, yAccessor, colorAccessor, xScale, yScale) {

        var rectPlot = new Plottable.Plots.Rectangle();
        rectPlot.addDataset(dataset);
        rectPlot.x(xAccessor, xScale);
        rectPlot.y(yAccessor, yScale);
        rectPlot.attr("fill", colorAccessor);
        return rectPlot;
    },

    OccupancyChart: function (data) {
        var xScale = new Plottable.Scales.Time();
        var xAxis = new Plottable.Axes.Time(xScale, "bottom");
        xAxis.formatter(Plottable.Formatters.multiTime());

        var xScale1 = new PlottableUtil.CategoryScale();
        var xAxis1 = new PlottableUtil.CategoryAxis(xScale1, "top");

        var yScale = new PlottableUtil.CategoryScale();
        var yAxis = new PlottableUtil.CategoryAxis(yScale, "left");

        var colorScale = ["#FFFFFF", "#FF0000", "#FF00FF", "#FFFF00", "#F0FFF0", "#0FF0FF"];
        var xAccessor = function(d) { return d.x; }
        var xAccessor1 = function(d) { return d.x1; }
        var yAccessor = function(d) { return d.y; }
        var colorAccessor = function(d) { return colorScale[d.val]; }

        var dataset = new Plottable.Dataset(data);

        var plot = new PlottableUtil.LinePlot(dataset, xAccessor, yAccessor, xScale, yScale, null, null);
        var plot1 = new PlottableUtil.RectPlot(dataset, xAccessor1, yAccessor, colorAccessor, xScale1, yScale);

        var plots = new Plottable.Components.Group([plot, plot1]);

        var chart = new Plottable.Components.Table([
                          [null,  xAxis1],
                          [yAxis, plots],
                          [null,  xAxis]
                        ]);

        var interaction = new Plottable.Interactions.Click();
        interaction.onClick(function(point) {
          var selection = plot1.entitiesAt(point)[0].selection;
          selection.attr("fill", "#F99D42");
          console.log(plot1.entityNearest(point).datum.x)
          console.log(plot1.entityNearest(point).datum.y)
        });
        interaction.attachTo(plot1);

        return {chart: chart, dataset: dataset};
    },

    GameChart: function (data) {
        var xScale = new PlottableUtil.CategoryScale();
        var xAxis = new PlottableUtil.CategoryAxis(xScale, "bottom");

        var yScale = new PlottableUtil.CategoryScale();
        var yAxis = new PlottableUtil.CategoryAxis(yScale, "left");

        var xAccessor = function(d) { return d.desc; }
        var yAccessor = function(d) { return 1; }
        var valAccessor = function(d) { return d.id; }

        var dataset = new Plottable.Dataset(data);

        var colorScale = new Plottable.Scales.InterpolatedColor();
        colorScale.range(["#eee", "#d6e685", "#8cc665", "#44a340", "#1e6823"]);

        var plot = new PlottableUtil.RectPlot(dataset, xAccessor, yAccessor, valAccessor, xScale, yScale, colorScale);
        plot.attr("stroke", "#fff")
        plot.attr("stroke-width", 5);

        var chart = new Plottable.Components.Table([
                          [yAxis, plot],
                          [null,  xAxis]
                        ]);

        var interaction = new Plottable.Interactions.Click();
        interaction.onClick(function(point) {
          var selection = plot.entitiesAt(point)[0].selection;
          selection.attr("fill", "#F99D42");
        });
        interaction.attachTo(plot);

        return {chart: chart, dataset: dataset};
    }
};