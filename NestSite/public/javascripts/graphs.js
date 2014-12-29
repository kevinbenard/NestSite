$(function() {
    var yAxisFormatter = function(val, axis) {
        return val + '° C';
    }

    var yAxisHumidity = function(val, axis) {
        return val.toFixed(axis.tickDecimals) + '%';
    }
    var plot = {};
    var overview = {};
    var dataset = [];
    var overviewDataset = [];
    var options = {
        legend: {
            container: $('#legendcontainer'),
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
            min: 15,
            max: 30,
            position: 'left',
            tickFormatter: yAxisFormatter
        }, {
            min: 25,
            max: 50,
            position: 'right',
            tickFormatter: yAxisHumidity
        } ],
        grid: {
            markings: weekendAreas
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

    $(document).ready(function() {
        $.ajax({
            type: "POST",
            url: '/',
            data: '',
            success: function(data) {
                //console.log(JSON.parse(data));
                var out = JSON.parse(data);
                curTemp = out.currentTemp;
                targetTemp = out.targetTemp;
                targetTempLow = out.targetTempLow;
                targetTempHigh = out.targetTempHigh;
                humidity = out.humidity;

                setNewData();
                plot = $.plot("#placeholder", dataset, options);
                overview = $.plot("#overview", overviewDataset, overviewOptions);
            },
            dataType: 'text'
        });

    });

    function setNewData() {
        dataset = [
            { id: "temp", label: "Temperature", data: curTemp, lines: { show: true }, color: "rgb(50,255,50)" },
            //{ id: "temp", label: "Temperature", data: curTemp, lines: { show: true }, color: "rgb(50,255,50)", threshold: { below: 21.0, color: "rgb(0,0,255)"} },
            { id: "target_temp", label: "Target Temperature", data: targetTemp, lines: { show: true, fill: 0.4 }, color: "rgb(255,50,0)", fillBetween: "temp"},
            { id: "target_low", data: targetTempLow, lines: {show:true, lineWidth: 0.5, fill: false}, color: "rgb(255,255,50)"},
            { id: "target_high", label: "Target Temperature Range", data: targetTempHigh, lines: {show:true, lineWidth: 0.5, fill: 0.1}, color: "rgb(255,255,50)", fillBetween:"target_low"},
            { id: "humidity", label: "Humidity", data: humidity, lines: {show:true, lineWidth: 0.8, fill: false}, color: "rgb(50,50,255)", yaxis: 2},
        ];
        overviewDataset = [
            targetTempHigh, targetTempLow, curTemp, 
            { id: "humidity", data: humidity, lines: {show:true}, color: "rgb(50,50,255)", yaxis: 2} 
        ];
    }

    function fanOnAreas(axes) {
        var markings = [],
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

        return markings;
    }

    function weekendAreas(axes) {
        var markings = [],
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

        return markings;
    }

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
