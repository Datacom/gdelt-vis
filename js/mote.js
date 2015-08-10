var _data;

// commodity
// country
// year
// value
// direction

function dim_zero_rows(chart) {
  chart.selectAll('text.row').classed('dim',function(d){return (d.value < 0.1)});
}

function cleanup(d) {
  d.value = +d.value
  return d;
}

queue()
    .defer(d3.csv, "data/mote.csv", cleanup)
    .await(showCharts);

function showCharts(err, data, event_dict) {
  
  function labelAccessor(withValue) {
    return function(d) {
      label = d.key
      if (withValue) {
        label = label + ": " + Math.floor(d.value);
      }
      return label;
    }
  }
  
  _data = data;
  ndx = crossfilter(_data);
  
  year = ndx.dimension(function(d) { return d.year });
  year_group = year.group().reduceSum(function (d){return d.value});
  
  year_chart = dc.barChart('#year')
    .dimension(year)
    .group(year_group)
    .margins({top: 10, right: 10, bottom: 20, left: 40})
    .height(300)
    .renderHorizontalGridLines(true)
    .renderVerticalGridLines(true)
    .transitionDuration(200)
    .x(d3.scale.linear().domain([2003,2015]))
    .xUnits(dc.units.integers)
    .centerBar(true)
    .elasticY(true)
    .ordering(function(d){ return d.key})

  year_chart.xAxis().ticks(12).tickFormat(function (d) {return d});
  year_chart.yAxis().tickFormat(d3.format('s')).ticks(12)
  
  
  commodity = ndx.dimension(function(d) { return d.commodity});
  commodity_group = commodity.group().reduceSum(function (d){return d.value})
  commodity_chart = dc.rowChart('#commodity')
    .dimension(commodity)
    .group(commodity_group)
    .transitionDuration(200)
    .height(400)
    .elasticX(true)
    .label(labelAccessor(false))
    .title(labelAccessor(true))
    .ordering(function(d) {return -d.value})
    .cap(24)
  commodity_chart.xAxis().ticks(4).tickFormat(d3.format('s'));
  commodity_chart.on('pretransition.dim', dim_zero_rows)

  country = ndx.dimension(function(d) { return d.country});
  country_group = country.group().reduceSum(function (d){return d.value})
  country_chart = dc.rowChart('#country')
    .dimension(country)
    .group(country_group)
    .transitionDuration(200)
    .height(400)
    .elasticX(true)
    .label(labelAccessor(false))
    .title(labelAccessor(true))
    .ordering(function(d) {return -d.value})
    .cap(24)
  country_chart.xAxis().ticks(4).tickFormat(d3.format('s'));
  country_chart.on('pretransition.dim', dim_zero_rows)
  

  direction = ndx.dimension(function(d) { return d.direction});
  direction_group = direction.group().reduceSum(function (d){return d.value})
  direction_chart = dc.pieChart('#direction')
    .innerRadius(60)
    .radius(100)
    .height(300)
    .dimension(direction)
    .group(direction_group)
    .transitionDuration(200)
    .label(labelAccessor(false))
    .title(labelAccessor(true))
    .ordering(function(d) {return -d.value})
  direction_chart.on('pretransition.dim', dim_zero_rows)
  
  year_chart.xAxis().ticks(12).tickFormat(function (d) {return d});
  year_chart.yAxis().tickFormat(d3.format('s')).ticks(12)

  dc.renderAll();
}
