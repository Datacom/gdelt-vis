

var _data;




var dateFormat = d3.time.format('%d/%m/%Y')
var withHours = d3.format("04d");
var timeFormat = d3.time.format('%H%M')
var display_dateFormat = d3.time.format('%Y-%m-%d')


function dim_zero_rows(chart) {
  chart.selectAll('text.row').classed('dim',function(d){return (d.value < 0.1)});
}

var date_domain = {
}

//var quad = ['Verbal Cooperation', 'Material Cooperation', 'Verbal Conflict', 'Material Conflict']


filter_dim = {}

// this is all map stuff. our dataset has northing and easting, so we might want to bring this back in eventually, but I think we might want to avoid identifying individual crashes in the long run.

//document.getElementById("filter").onkeyup = function(e) {
//  text = e.target.value.toUpperCase();
//  filter_dim.filter(function(d){
//    return d.toUpperCase().indexOf(text) > -1;
//  })
//  dc.redrawAll();
//  clearMarkers();
//}
//
//var map;
//var markers = [];
//
//function clearMarkers() {
//  updateMarkers([])
//}
//
//var updateMarkers = _.debounce(updateMarkers_raw, 200)
//
//function updateMarkers_raw(new_markers) {
//  _.each(markers, function (marker) {map.removeLayer(marker)}) // remove all old markers
//  markers = _.map(new_markers, function (marker) {return L.marker([marker.lat, marker.long],{title:marker.named})})  //generate new markers
//  markers_bounds = L.featureGroup(markers).getBounds();
//  _.each(markers, function(marker) {map.addLayer(marker)} )  // add new markers to map
//  map.fitBounds(markers_bounds, {maxZoom:5, padding:[30,30]})
//}



function cleanup(d) {
  
  d.crash_date = dateFormat.parse(d.CRASHDATE);
  d.crash_week = d3.time.week.floor(d.crash_date);
//  d.crash_day = d.crash_date.getDay();
  d.crash_day = (d.crash_date.getDay() + 6)%7;
  d.crash_hour = +withHours(+d.CRASHTIME).slice(0,2);
  d.objects_struck = d.OBJECTSSTRUCK.split('')
  
  d.junction_type = d.JUNCTIONTYPE || 'Not at a junction'
  d.traffic_control = d.TRAFCTRL || 'None'
  d.vehicle_1 = d.VEHICLES.slice(0,1);
  d.all_vehicles = (d.vehicle_1 + (d.VEHICLES.slice(3) || '')).trim().split('');
  d.crash_causes = d.CAUSES.trim().split(' ');
  for (i in d.crash_causes){
    cause = d.crash_causes[i]
    d.crash_causes[i] = ''+ (+cause.slice(0,2) * 10) ;
    if (d.crash_causes[i] == '360') {
      d.crash_causes[i] = '350'
    }
  }
  
  d.crash_causes = _.uniq(d.crash_causes)
  
  date_domain.min = date_domain.min || d.crash_date;
  date_domain.max = date_domain.max || d.crash_date;
  d.n_fatals = +d.CRASHFATALCNT;
  d.n_serious = +d.CRASHSEVCNT;
  d.n_minor = +d.CRASHMINCNT;
  d.WTHRa = d.WTHRa.trim()
  d.LIGHT = d.LIGHT.trim()
  if (d.LIGHT.indexOf('B') == 0) {
    d.LIGHT = 'B'
  }
  if (d.LIGHT.indexOf('O') == 0) {
    d.LIGHT = 'O'
  }
  if (d.LIGHT.indexOf('F') == 0) {
    d.LIGHT = 'I'
  }
  if (d.LIGHT.indexOf('N') == 0) {
    d.LIGHT = 'I'
  }
  if (d.LIGHT.trim() == '') {
    d.LIGHT = 'I'
  }
  d.ROADWET = d.ROADWET.trim()  
  d.causes = _.filter(d.CAUSES.split(' '), function(z) {return z.length > 1});
  if (d.crash_date < date_domain.min) {
      date_domain.min = d.crash_date;
  }
  
  if (d.crash_date > date_domain.max) {
      date_domain.max = d.crash_date;
  }
  
  return d;
}

var dict = {
  'Others':'Others'
}

//function add_dict(d) {
//  dict[d.CAMEOEVENTCODE] = d.EVENTDESCRIPTION.replace(', not specified below','').trim();
//}

queue()
    .defer(d3.csv, "data/mvc/crash-data-2014-reduced.csv", cleanup)
    .defer(d3.tsv, "data/mvc/dicts.tsv")
    .defer(d3.csv, "data/mvc/cause_codes_short.csv")
    .await(showCharts);

dictionaries = {
}

function showCharts(err, data, dicts, cause_codes_dict) {
  console.log(err)
  
//  _event_dict = event_dict;
//  for (i in event_dict) {
//    add_dict(event_dict[i]);
//  }
  dictionaries.cause_codes = {'Others':'Others'};
  for (i in cause_codes_dict) {
    entry = cause_codes_dict[i]
    dictionaries.cause_codes[entry.key] = entry.value;
  }
  
  for (i in dicts) {
    entry = dicts[i];
    dictionaries[entry.chart] = dictionaries[entry.chart] || {}
    dictionaries[entry.chart][entry.key] = entry.label;
  }
  
  _data = data;
//  for (i in data) {
//    cleanup(data[i]);
//  }
  
  ndx = crossfilter(_data);
  
//  filter_dim = ndx.dimension(function(d) {return d.SOURCEURL});

  date_domain.min = d3.time.month.offset(date_domain.min, -1)
  date_domain.max = d3.time.month.offset(date_domain.max, +1)
  

  date = ndx.dimension(function(d) { return d.crash_week });
  date_group = date.group().reduceCount();
  

  date_chart = dc.barChart('#date')
    .height(200)
    .dimension(date)
    .group(date_group)
    .elasticY(true)
    .x(d3.time.scale().domain([date_domain.min, date_domain.max])) 
    .xUnits(d3.time.weeks)
    .centerBar(true)
    .renderHorizontalGridLines(true)
    .renderVerticalGridLines(true)
    .transitionDuration(200)

  date_chart.yAxis().ticks(4).tickFormat(d3.format('s'));

  time = ndx.dimension(function(d) { return d.crash_hour });
  time_group = time.group().reduceCount();
  

  time_chart = dc.barChart('#time')
    .height(200)
    .dimension(time)
    .group(time_group)
    .elasticY(true)
    .x(d3.scale.linear().domain([-1, 24]))
    .centerBar(true)
    .renderHorizontalGridLines(true)
    .renderVerticalGridLines(true)
    .transitionDuration(200)

  time_chart.yAxis().ticks(4).tickFormat(d3.format('s'));
  
  
  day = ndx.dimension(function(d) { return d.crash_day });
  day_group = day.group().reduceCount();

  day_chart = dc.barChart('#day')
    .height(200)
    .dimension(day)
    .group(day_group)
    .elasticY(true)
    .x(d3.scale.linear().domain([-1, 7]))
    .centerBar(true)
    .renderHorizontalGridLines(true)
    .renderVerticalGridLines(true)
    .transitionDuration(200)

  days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  day_chart.yAxis().ticks(4).tickFormat(d3.format('s'));
  day_chart.xAxis().tickFormat(function(x) { return days[x]});
  
  TLA = ndx.dimension(function(d) { return d.TLANAME});
  TLA_group = TLA.group().reduceCount();
  TLA_chart = dc.rowChart('#TLA')
    .dimension(TLA)
    .group(TLA_group)
    .transitionDuration(200)
    .height(400)
    .elasticX(true)
    .ordering(function(d) {return -d.value})
    .cap(20)
  
  TLA_chart.xAxis().ticks(4).tickFormat(d3.format('s'));
  TLA_chart.on('pretransition.dim', dim_zero_rows)
  
  objects_struck_tags = createTagDimAndGroup(ndx, 'objects_struck')
  objectsstruck_chart = dc.rowChart('#objectsstruck')
  
  objectsstruck_chart.dimension(objects_struck_tags.dim)
    .group(objects_struck_tags.group)
    .filterHandler(objects_struck_tags.filterHandlerFor(objectsstruck_chart))
    .transitionDuration(200)
    .height(400)
    .elasticX(true)
    .label(function(d) { return dictionaries.ObjectStruck[d.key]})
    .title(function(d) { return dictionaries.ObjectStruck[d.key] + ": " + d.value})
    .ordering(function(d) {return -d.value})
    .cap(25)
  
  objectsstruck_chart.xAxis().ticks(4).tickFormat(d3.format('s'));
  objectsstruck_chart.on('pretransition.dim', dim_zero_rows)


  weather = ndx.dimension(function(d) { return d.WTHRa});
  weather_group = weather.group().reduceCount();
 
  weather_chart = dc.rowChart('#weather')
    .dimension(weather)
    .group(weather_group)
    .transitionDuration(200)
    .height(200)
    .elasticX(true)
    .label(function(d) { return dictionaries.WTHRa[d.key]})
    .title(function(d) { return dictionaries.WTHRa[d.key] + ": " + d.value})
    .ordering(function(d) {return -d.value})
    .cap(10)
  
  weather_chart.xAxis().ticks(4).tickFormat(d3.format('s'));
  weather_chart.on('pretransition.dim', dim_zero_rows)

  light = ndx.dimension(function(d) { return d.LIGHT});
  light_group = light.group().reduceCount();
  light_chart = dc.pieChart('#light')
    .innerRadius(50)
    .radius(80)
    .dimension(light)
    .group(light_group)
    .label(function(d) { return dictionaries.LIGHT[d.key]})
    .title(function(d) { return dictionaries.LIGHT[d.key] + ": " + d.value})
    .transitionDuration(200)
    .height(200)
  
  roadwet = ndx.dimension(function(d) { return d.ROADWET});
  roadwet_group = roadwet.group().reduceCount();
  roadwet_chart = dc.pieChart('#roadwet')
    .innerRadius(50)
    .radius(80)
    .dimension(roadwet)
    .group(roadwet_group)
    .label(function(d) { return dictionaries.ROADWET[d.key]})
    .title(function(d) { return dictionaries.ROADWET[d.key] + ": " + d.value})
    .transitionDuration(200)
    .height(200)
  
  
  crash_causes_tags = createTagDimAndGroup(ndx, 'crash_causes')
  crash_causes_chart = dc.rowChart('#crash_causes')
  
  crash_causes_chart.dimension(crash_causes_tags.dim)
    .group(crash_causes_tags.group)
    .filterHandler(crash_causes_tags.filterHandlerFor(crash_causes_chart))
    .transitionDuration(200)
    .height(400)
    .elasticX(true)
    .label(function(d) { return dictionaries.cause_codes[d.key]})
    .title(function(d) { return dictionaries.cause_codes[d.key] + ": " + d.value})
    .ordering(function(d) {return -d.value})
    .cap(25)
  
  crash_causes_chart.xAxis().ticks(4).tickFormat(d3.format('s'));
  crash_causes_chart.on('pretransition.dim', dim_zero_rows)

  all_vehicles_tags = createTagDimAndGroup(ndx, 'all_vehicles')
  all_vehicles_chart = dc.rowChart('#all_vehicles')
  
  all_vehicles_chart.dimension(all_vehicles_tags.dim)
    .group(all_vehicles_tags.group)
    .filterHandler(all_vehicles_tags.filterHandlerFor(all_vehicles_chart))
    .transitionDuration(200)
    .height(400)
    .elasticX(true)
    .label(function(d) { return dictionaries.all_vehicles[d.key]})
    .title(function(d) { return dictionaries.all_vehicles[d.key] + ": " + d.value})
    .ordering(function(d) {return -d.value})
    .cap(25)
  
  all_vehicles_chart.xAxis().ticks(4).tickFormat(d3.format('s'));
  all_vehicles_chart.on('pretransition.dim', dim_zero_rows)
  
  
  
 dc.renderAll(); 

}
