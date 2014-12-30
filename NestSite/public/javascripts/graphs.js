$(function() {
    var yAxisFormatter = function(val, axis) {
        return val + '° C';
    }

    var yAxisHumidity = function(val, axis) {
        return val.toFixed(axis.tickDecimals) + '%';
    }
    var markings = [];
    var plot = {};
    var overview = {};
    var weatherPlot = {};
    var dataset = [];
    var overviewDataset = [];
    var weatherDataset = [];
    var legends;
    var options = {
        legend: {
            noColumns: 5
        },
        series: {
            lines: {
                show:true
            }
        },
        crosshair: {
            mode: "x"
        },
        xaxis: {
            mode: "time",
            timeformat: "%m/%d/%y %H:%M",
            tickLength: 5
        },
        xaxes: [ ],
        yaxes: [ {
            min: 15,
            max: 30,
            position: 'left',
            tickFormatter: yAxisFormatter
        }, {
            min: 17.5,
            max: 50,
            position: 'right',
            tickFormatter: yAxisHumidity
        } ],
        grid: {
            markings: weekendAreas,
            hoverable: true,
            autoHighlight: false
        }
    };
    var overviewOptions = {
        series: {
            lines: {
                show: true,
                lineWidth: 1
            },
            shadowSize: 0
        },
        xaxis: {
            ticks: [],
            mode: "time",
        },
        yaxes: [ {
            min: 15,
            max: 30,
            position: 'left',
            autoscaleMargin: 0.1
        }, {
            min: 25,
            max: 50,
            position: 'right',
            tickFormatter: yAxisHumidity,
            autoscaleMargin: 0.1
        } ],
        selection: {
            mode: "x"
        }
    };
    var weatherOptions = {
        legend: {
            noColumns: 5
        },
        series: {
            lines: {
                show:true
            }
        },
        xaxis: {
            mode: "time",
            timeformat: "%m/%d/%y %H:%M",
            tickLength: 5
        },
        xaxes: [ ],
        yaxes: [ {
            min: -40,
            max: 40,
            position: 'left',
            tickFormatter: yAxisFormatter
        }, {
            min: 20,
            max: 100,
            position: 'right',
            tickFormatter: yAxisHumidity,
            autoscaleMargin: 0.1
        } ],
        grid: {
            markings: weekendAreas
        }
    };
    $(document).ready(function() {
        getThermoData();
    });

    function getThermoData() {
        $.ajax({
            type: "POST",
            url: '/',
            data: {type: 'thermo'},
            success: function(data) {
                //console.log(JSON.parse(data));
                var out = JSON.parse(data);
                curTemp = out.currentTemp;
                targetTemp = out.targetTemp;
                targetTempLow = out.targetTempLow;
                targetTempHigh = out.targetTempHigh;
                humidity = out.humidity;

                setThermoData();
                plot = $.plot("#placeholder", dataset, options);
                overview = $.plot("#overview", overviewDataset, overviewOptions);

                legends = $('#placeholder').find('.legendLabel');
                legends.each(function() {
                    $(this).css('width', $(this).width());
                }); 

                getWeatherData();
            },
            dataType: 'text'
        });
    }

    function getWeatherData() {
        $.ajax({
            type: "POST",
            url: '/',
            data: {type: 'weather'},
            success: function(data) {
                //console.log(JSON.parse(data));
                var out = JSON.parse(data);
                weatherTemp = out.weatherTemp;
                //curTemp = out.currentTemp;
                relHumidity = out.relHumidity;
                windchillTemp = out.windchillTemp;

                setWeatherData();
                weatherPlot = $.plot("#weatherchart", weatherDataset, weatherOptions);
                //overview = $.plot("#overview", overviewDataset, overviewOptions);
            },
            dataType: 'text'
        });
    }

    function setThermoData() {
        dataset = [
            { id: "temp", label: "Temperature: 0", data: curTemp, lines: { show: true }, color: "rgb(50,255,50)" },
            { id: "target_temp", label: "Target Temperature: 0", data: targetTemp, lines: { show: true, fill: 0.4 }, color: "rgb(255,50,0)", fillBetween: "temp"},
            { id: "target_low", data: targetTempLow, lines: {show:true, lineWidth: 0.5, fill: false}, color: "rgb(255,255,50)"},
            { id: "target_high", label: "Target Temperature Range", data: targetTempHigh, lines: {show:true, lineWidth: 0.5, fill: 0.1}, color: "rgb(255,255,50)", fillBetween:"target_low"},
            { id: "humidity", label: "Humidity", data: humidity, lines: {show:true, lineWidth: 0.8, fill: false}, color: "rgb(50,50,255)", yaxis: 2},
        ];
        overviewDataset = [
            targetTempHigh, targetTempLow, curTemp, 
            { id: "humidity", data: humidity, lines: {show:true}, color: "rgb(50,50,255)", yaxis: 2} 
        ];
    }

    function setWeatherData() {
        weatherDataset = [
            { id: "indoorTemperature", label: "Indoor Temperature", data: curTemp, lines: { show: true }, color: "rgb(255,50,50)" },
            { id: "outsideTemperature", label: "Outside Temperature", data: weatherTemp, lines: { show: true }, color: "rgb(50,255,50)" },
            { id: "outsideTemperature", label: "Windchill", data: windchillTemp, lines: { show: true }, color: "rgb(255,255,50)" },
            { id: "outsideHumidity", label: "Outside Humidity", data: relHumidity, lines: { show: true }, color: "rgb(50,50,255)", yaxis:2 }
        ];
    }

    function hasLeafAreas(axes) {
        //d = new Date(axes.xaxis.min);
        //var i = d.getTime();

        ////do {
            //markings.push({ axis: { from: d, to: d + 30000},color: "rgb(152,251,152)" });
            //i += 5;
            //console.log(axes.xaxis);
        ////} while (i < axes.xaxis.max);

        //return markings;
    }

    function weekendAreas(axes) {
        d = new Date(axes.xaxis.min);
        // go to the first Saturday
        d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 1) % 7))
        d.setUTCSeconds(0);
        d.setUTCMinutes(0);
        d.setUTCHours(0);

        var i = d.getTime();

        // when we don't set yaxis, the rectangle automatically
        // extends to infinity upwards and downwards
        do {
            markings.push({ xaxis: { from: i, to: i + 2 * 24 * 60 * 60 * 1000 } });
            i += 7 * 24 * 60 * 60 * 1000;
        } while (i < axes.xaxis.max);

        hasLeafAreas(axes);
        return markings;
    }

    //var legends = $('#placeholder').find('.legendLabel');
    //legends.each(function() {
        //$(this).css('width', $(this).width());
    //}); 

    var updateLegendTimeout = 0;
    var latestPosition = 0;

    function updateLegend() {
        updateLegendTimeout = 0;
        var pos = latestPosition;
        var axes = plot.getAxes();

        if (pos.x < axes.xaxis.min || pos.x > axes.xaxis.max ||
            pos.y < axes.yaxis.min || pos.y > axes.yaxis.max) {
            return;
        }

        var i = 0;
        var j = 0;
        //var dataset = plot.getData();
        for (i = 0; i < dataset.length; i++) {
            var series = dataset[i];

            // Find nearest points
            for (j = 0; j < series.data.length; ++j) {
                if (series.data[j][0] > pos.x) {
                    break;
                }
            }

            // Now Interpolate
            var y;
            var p1 = series.data[j - 1];
            var p2 = series.data[j];

            if (p1 == null) {
                y = parseFloat(p2[1]);
            } else if (p2 == null) {
                y = parseFloat(p1[1]);
            } else {
                y = parseFloat(p1[1] + (p2[1] - p1[1]) * (pos.x - p1[0]) / (p2[0] - p1[0]));
            }

            if(series.label && i < 3) {
                legends.eq(i).text(series.label.replace(/:+.*/, ': ' + y.toFixed(2)));
            } 
        }
    }

    $("#placeholder").bind("plothover", function (event, pos, item) {
        latestPosition = pos;
        if(!updateLegendTimeout) {
            updateLegendTimeout = setTimeout(updateLegend, 50);
        }
    });

    $("#placeholder").bind("plotselected", function (event, ranges) {
        // do the zooming
        $.each(plot.getXAxes(), function(_, axis) {
            var opts = axis.options;
            opts.min = ranges.xaxis.from;
            opts.max = ranges.xaxis.to;
        });

        plot.setupGrid();
        plot.draw();
        plot.clearSelection();

        // don't fire event on the overview to prevent eternal loop
        overview.setSelection(ranges, true);
    });

    $("#overview").bind("plotselected", function (event, ranges) {
        plot.setSelection(ranges);
    });
});
