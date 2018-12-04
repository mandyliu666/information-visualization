// set the dimensions and margins of the graph
var margin = {top: 10, right: 20, bottom: 40, left: 50},
    width = 800 - margin.left - margin.right,
    height = 630 - margin.top - margin.bottom,
    histoWidth = 600 - margin.left - margin.right,
    histoHeight = 310 - margin.top - margin.bottom,
    scatterWidth = 800 - margin.left - margin.right,
    scatterHeight = 440 - margin.top - margin.bottom,
    parallelHeight = 400 - margin.top - margin.bottom,
    legendWidth = 400 - margin.top - margin.bottom
    legendHeight = 500 - margin.top - margin.bottom;

// set the ranges for histogram
var x = d3.scaleTime()
          .domain([new Date(1960, 1, 1), new Date(2018, 1, 1)])
          .rangeRound([0, histoWidth]);
var y = d3.scaleLinear()
          .range([histoHeight, 0]);

// set the ranges for scatterplot 
var scatterX = d3.scaleLinear()
                .rangeRound([0, scatterWidth]);

var scatterY = d3.scaleLinear()
                .range([scatterHeight - 40, 0]);

var scatterR = d3.scaleSqrt()
                .range([3, 20]);

// set the parameters for the histogram
var histogram = d3.histogram()
    .value(function(d) { return d.date; })
    .domain(x.domain())
    .thresholds(x.ticks(d3.timeYear));

// append the svg object to the body of the page
// append a 'group' element to 'svg'
// moves the 'group' element to the top left margin

var histoTip = d3.tip()
    .attr("class", "histoTip")
    .offset([-10, 0])
    .html(function (d) {
      return "Number of Movies of year " + d.x0.getFullYear() + ": <strong>" + d.length + "</strong>";
    });

var scatterTip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

var svg = d3.select("#charts-background").append("svg")
    .attr("transform", "translate(0, 0)")
    .attr("width", histoWidth + margin.left + margin.right)
    .attr("height", histoHeight + margin.top + margin.bottom);

var scatterSvg = d3.select("#charts-background").append("svg")
    .attr("width", scatterWidth + margin.left + margin.right)
    .attr("height", scatterHeight + margin.top + margin.bottom);

var histo = svg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

histo.call(histoTip);

var scatter = scatterSvg.append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//scatter.call(scatterTip);

var parallel = svg.append("g")
    .attr("id", "parallel")
    .attr("width", width)
    .attr("height", parallelHeight)
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var countries = ["All Countries"];

// parse the date / time
var parseDate = d3.timeParse("%Y");

function parseYear (date) {
  var len = date.length;
  var year = date.substring(len - 2, len);
  if(year < "18") return "20" + year;
  else return "19" + year;
}

function parseGenre (genre) {
  var start = genre.indexOf('name') + 8;
  var end = genre.indexOf('}') - 1;
  return genre.substring(start, end);
}

function parseCountry (country) {
  var start = country.indexOf('name') + 8;
  var end = country.indexOf('}') - 1;
  var res = country.substring(start, end);
  if(!countries.includes(res)) countries.push(res);
  return res;
}

var genres = ["Action", "Adventure", "Fantasy", "Animation", "Science Fiction", "Drama", "Thriller", "Family", "Comedy", "History", "War", "Western", "Romance", "Crime", "Mystery", "Horror", "Music", "Documentary"];
var colors = ["#ff790b", "#db3522", "#ffb677", "#ffd050", "#ff80aa", "#ff2579", "#ffe419", "#a799ff", "#5168ff", "#1357cc", "#4299c4", "#91c3c7", "#4ac9a9", "#3fcf6d", "#bf8ad1", "#b8d472", "#d68585", "#d9697b"];
var colorScale = {
  "Action": "#ff790b",
  "Adventure": "#db3522",
  "Fantasy": "#ffb677",
  "Animation": "#ffd050",
  "Science Fiction": "#ff80aa",
  "Drama": "#ff2579",
  "Thriller": "#ffe419",
  "Family": "#a799ff",
  "Comedy": "#5168ff",
  "History": "#1357cc",
  "War": "#4299c4",
  "Western": "#91c3c7",
  "Romance": "#4ac9a9",
  "Crime": "#3fcf6d",
  "Mystery": "#bf8ad1",
  "Horror": "#b8d472",
  "Music": "#d68585",
  "Documentary": "#d9697b"
};
function fillColor (genre) {
  return colorScale[genre];
}

// get the data
d3.csv("movies.csv", function(error, data) {
  if (error) throw error;

  data = data.filter(function (d) {
    d.year = parseYear(d.release_date);
    d.date = parseDate(d.year); 
    d.revenue = +d.revenue;
    d.budget = +d.budget;
    return d.production_countries.length > 2 
        && d.budget > 0 
        && d.revenue > 0
        && +d.vote_count > 50
        && d.date > new Date(1960, 1, 1); 
  });

  // format the data
  data.forEach(function(d) {
      d.year = parseYear(d.release_date);
      d.date = parseDate(d.year); 
      d.revenue = +d.revenue;
      d.budget = +d.budget;
      d.country = parseCountry(d.production_countries);
      d.profit = +(d.revenue - d.budget) / 1000000;
      d.vote = +d.vote_average;
      d.genre = parseGenre(d.genres);
      d.popularity = +d.popularity;
  });

  // group the data for the bars
  var bins = histogram(data);

  // get the width of each bar 
  var barWidth = histoWidth / bins.length;

  // scale the range for histogram in the y domain
  y.domain([0, d3.max(bins, function(d) { return d.length; })]);

  // scale the range for scatterplot in x, y and r domain
  scatterX.domain([d3.min(data, function(d) { return d.profit; }), d3.max(data, function(d) { return d.profit; })]);
  scatterY.domain([d3.min(data, function(d) { return d.vote; }), d3.max(data, function(d) { return d.vote; })]);
  scatterR.domain(d3.extent(data, function(d){ return d.popularity; })).nice();

  // append the bar rectangles of histogram to the svg element
  histo.append("g")
    .selectAll("rect")
      .data(bins)
    .enter().append("rect")
      .attr("class", "bar")
      .attr("x", 1)
      .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
      .attr("width", function(d) { 
        if(x(d.x1) >= x(d.x0) + 1)
          return x(d.x1) - x(d.x0) - 1; 
        else return 0;
      })
      .attr("height", function(d) { return histoHeight - y(d.length); })
      .attr("fill", "#ed9446")
      .on("mouseover", histoTip.show)
      .on("mouseout", histoTip.hide);

  // append the circles of scatterplot to the svg element
  scatter.append("g")
    .selectAll("circle")
      .data(data)
    .enter().append("circle")
      .attr("class", "dots")
      .attr("r", function(d){ return scatterR(d.popularity); })
      .attr("cx", function(d) { return scatterX(d.profit); })
      .attr("cy", function(d) { return scatterY(d.vote); })
      .attr("fill", function(d) { return fillColor(d.genre); })
      .on("mouseover", function (d) {
        var profit = "$" + d3.format(",d")(d.profit * 1000000);
        scatterTip
          .transition()
          .duration(200)
          .style("opacity", .9);
        scatterTip.html(
          "<span style='color: #ff9d5c; font-size: 15px;'><strong>" + d.title + "</strong></span></br>" +
          "<span style='color: #b8d472'>Popularity: </span>" + d.popularity + "<br/>" + 
          "<span style='color: #b8d472'>Profit: </span>" + profit + "</br>" +
          "<span style='color: #b8d472'>Average Rating: </span>" + d.vote + " / 10" + "</br>" +
          "<span style='color: #b8d472'>Genre: </span>" + d.genre + "</br>" +
          "<span style='color: #b8d472'>Overview: </span>" + d.overview
          )
          .style("left", (d3.event.pageX) + "px")
          .style("top", (d3.event.pageY - 50) + "px");
      })
      .on("mouseout", function (d) {
        scatterTip.transition()
          .duration(500)
          .style("opacity", 0);
      });

  
  //default selection
  var selection = "All Countries";

  // add the x and y Axis for histogram
  var xAxis = histo.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + histoHeight + ")")
      .call(d3.axisBottom(x));
  xAxis.append("text")
      .attr("x", 250)
      .attr("y", 20)
      .attr("dy", "1em")
      .style("text-anchor", "end")
      .style("font-weight", "bolder")
      .style("font-family", "Martel Sans")
      .text("Year");
  var yAxis = histo.append("g")
      .attr("class", "y axis")
      .call(d3.axisLeft(y).tickFormat(d3.format(",d")).ticks(10).tickSize([-histoWidth]));     
  yAxis.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -45)
      .attr("x", -70)
      .attr("dy", "1em")
      .style("text-anchor", "end")
      .style("font-weight", "bolder")
      .style("font-family", "Martel Sans")
      .text("Number of Movies");

  // add the x and y Axis for scatterplot
  var scatterXAxis = scatter.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0, " + (histoHeight + margin.top + margin.bottom + 40) + ")")
      .call(d3.axisBottom(scatterX).tickFormat(function(d) { return "$" + d3.format(",d")(d); }).tickSize([-scatterHeight]));
  scatterXAxis.append("text")
      .attr("x", 350)
      .attr("y", 20)
      .attr("dy", "1em")
      .style("text-anchor", "end")
      .style("font-weight", "bolder")
      .style("font-family", "Martel Sans")
      .text("Profit (Million)");
  var scatterYAxis = scatter.append("g")
      .attr("class", "y axis")
      .attr("transform", "translate(0, 0)")
      .call(d3.axisLeft(scatterY));
  scatterYAxis.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -120)
      .attr("dy", "1em")
      .style("text-anchor", "end")
      .style("font-weight", "bolder")
      .style("font-family", "Martel Sans")
      .text("Average Rating");

  var selector = d3.select("#drop")
      .append("select")
      .attr("id","dropdown")
      .on("change", function(d){
          selection = d3.event.target.value;
          var new_data = data.filter(function (d) { 
            if(selection != "All Countries") {
              return d.country === selection;
            } else return d.country; 
          });

          var new_bins = histogram(new_data);

          // update the x and y domain for the histogram
          var start_year = d3.min(new_data, function(d) { return d.year; });
          var end_year = d3.max(new_data, function(d) { return d.year; });
          x.domain([new Date(parseInt(start_year) - 1, 1, 1), new Date(parseInt(end_year) + 1, 1, 1)]);
          y.domain([0, d3.max(new_bins, function(d){ return d.length; })]);

          // update the x and y domain for the scatterplot
          scatterX.domain([d3.min(new_data, function(d) { return d.profit; }), d3.max(new_data, function(d) { return d.profit; })]);
          scatterY.domain([d3.min(new_data, function(d) { return d.vote; }), d3.max(new_data, function(d) { return d.vote; })]);
          scatterR.domain(d3.extent(new_data, function(d){ return d.popularity; })).nice();

          // update the x and y ticks for the histogram
          var x_ticks = 0;
          if(parseInt(end_year) - parseInt(start_year) + 1 >= 10) x_ticks = 10;
          else x_ticks = parseInt(end_year) - parseInt(start_year) + 2;

          var y_ticks = 0;
          if(d3.max(new_bins, function(d){ return d.length; }) >= 10) y_ticks = 10;
          else y_ticks = d3.max(new_bins, function(d){ return d.length; });

          // update x and y axes for histogram
          xAxis
            .transition()
            .duration(1000)
            .call(d3.axisBottom(x).ticks(d3.timeYear).ticks(x_ticks))
            .attr("stroke", "fff");
          yAxis
            .transition()
            .duration(1000)
            .call(d3.axisLeft(y).tickFormat(d3.format(",d")).ticks(y_ticks).tickSize([-histoWidth]));

          // update x and y axes for scatterplot
          scatterXAxis
            .transition()
            .duration(1000)
            .call(d3.axisBottom(scatterX).tickFormat(function(d) { return "$" + d3.format(",d")(d); }).tickSize([-scatterHeight]));
          scatterYAxis
            .transition()
            .duration(1000)
            .call(d3.axisLeft(scatterY));

          // update dots for scatterplot
          var circles = scatter.selectAll("circle")
            .remove()
            .exit();

          circles.append("g")
            .data(new_data)
            .enter().append("circle")
            .attr("class", "dots")
            .attr("transform", "translate(0, 0)")
            .attr("r", function(d){ return scatterR(d.popularity); })
            .attr("cx", function(d) { return scatterX(d.profit); })
            .attr("cy", function(d) { return scatterY(d.vote); })
            .attr("fill", function(d) { return fillColor(d.genre); })
            .on("mouseover", function (d) {
              var profit = "$" + d3.format(",d")(d.profit * 1000000);
              scatterTip
                .transition()
                .duration(200)
                .style("opacity", .9);
              scatterTip.html(
                "<span style='color: #ff9d5c; font-size: 15px;'><strong>" + d.title + "</strong></span></br>" +
                "<span style='color: #b8d472'>Popularity: </span>" + d.popularity + "<br/>" + 
                "<span style='color: #b8d472'>Profit: </span>" + profit + "</br>" +
                "<span style='color: #b8d472'>Average Rating: </span>" + d.vote + " / 10" + "</br>" +
                "<span style='color: #b8d472'>Genre: </span>" + d.genre + "</br>" +
                "<span style='color: #b8d472'>Overview: </span>" + d.overview
                
                )
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 50) + "px");
            })
            .on("mouseout", function (d) {
              scatterTip.transition()
                .duration(500)
                .style("opacity", 0);
            });

          histo.selectAll("rect")
            .data(new_bins)
            .transition()
            .duration(1000)
            .attr("transform", function(d) { return "translate(" + x(d.x0) + "," + y(d.length) + ")"; })
            .attr("width", function(d) { 
              if(x(d.x1) >= x(d.x0) + 1)
                return x(d.x1) - x(d.x0) - 1; 
              else return 0;
            })
            .attr("height", function(d) { return histoHeight - y(d.length); });


          histo.selectAll("rect")
            .data(new_bins)
            .on("mouseover", histoTip.show)
            .on("mouseout", histoTip.hide);
          
          
updatePlotly(new_data);

        });

  selector.selectAll("option")
    .data(countries)
    .enter().append("option")
    .attr("value", function(d) { return d; })
    .text(function(d) { return d; });

});

function unpack(rows, key) {
  return rows.map(function(row) { 
    return row[key]; 
  });
}

Plotly.d3.csv('movies.csv', function(err, rows){

rows = rows.filter(function (d) {
    d.year = parseYear(d.release_date);
    d.date = parseDate(d.year); 
    d.revenue = +d.revenue;
    d.budget = +d.budget;
    d.budget = d.budget / 1000000;
    d.revenue = d.revenue / 1000000000;
    return d.production_countries.length > 2 
        && d.budget > 0 
        && d.revenue > 0
        && +d.vote_count > 50
        && d.date > new Date(1960, 1, 1); 
  });

// format the data
  rows.forEach(function(d) {
      var index = d.production_countries.indexOf(':');
      d.country = d.production_countries.substring(index + 3, index + 5);
      if(!countries.includes(d.country)) countries.push(d.country);
      d.genre = parseGenre(d.genres);
      d.genre_id = genres.indexOf(d.genre) / 17;
      d.popularity = +d.popularity;
  });

  var data = [{
    type: 'parcoords',
    pad: [80, 80, 80],
    line: {
      color: unpack(rows, 'genre_id'),
      colorscale: [[0, colors[0]], [1 / 17, colors[1]], [2 / 17, colors[2]], 
                   [3 / 17, colors[3]], [4 / 17, colors[4]], [5 / 17, colors[5]], 
                   [6 / 17, colors[6]], [7 / 17, colors[7]], [8 / 17, colors[8]],
                   [9 / 17, colors[9]], [10 / 17, colors[10]], [11 / 17, colors[11]], 
                   [12 / 17, colors[12]], [13 / 17, colors[13]], [14 / 17, colors[14]],
                   [15 / 17, colors[15]], [16 / 17, colors[16]], [1, colors[17]]]
    },
    dimensions: [{
      range: [70, 225],
      label: 'Runtime (Minute)',
      values: unpack(rows, 'runtime')
    }, {
      constraintrange: [1, 200],
      range: [1, 380],
      label: 'Budget (Million)',
      values: unpack(rows, 'budget')
    }, {
      label: 'Revenue (Billion)',
      range: [0, 2.8],
      values: unpack(rows, 'revenue')
    }]
  }];

  var layout = {
    width: 670,
    height: 320,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    font: {
      family: 'Martel Sans'
    },
    margin: {
      l: 50,
      r: 50,
      t: 70,
      b: 50
    }
  };

 Plotly.newPlot('graphDiv', data, layout);

});

function updatePlotly (rows) {
  rows.forEach(function (d) {
    d.genre_id_new = genres.indexOf(d.genre) / 17;
  });
  var data_update = {
    line: {
    color: unpack(rows, 'genre_id_new'),
    colorscale: [[0, colors[0]], [1 / 17, colors[1]], [2 / 17, colors[2]], 
                 [3 / 17, colors[3]], [4 / 17, colors[4]], [5 / 17, colors[5]], 
                 [6 / 17, colors[6]], [7 / 17, colors[7]], [8 / 17, colors[8]],
                 [9 / 17, colors[9]], [10 / 17, colors[10]], [11 / 17, colors[11]], 
                 [12 / 17, colors[12]], [13 / 17, colors[13]], [14 / 17, colors[14]],
                 [15 / 17, colors[15]], [16 / 17, colors[16]], [1, colors[17]]]
    }
  };

  var layout_update = {
  };

  Plotly.update('graphDiv', data_update, layout_update);
}



var legends = [{ "id": 0, "genre": genres[0], "color": colors[0] }, 
               { "id": 1, "genre": genres[1], "color": colors[1] },
               { "id": 2, "genre": genres[2], "color": colors[2] },
               { "id": 3, "genre": genres[3], "color": colors[3] },
               { "id": 4, "genre": genres[4], "color": colors[4] },
               { "id": 5, "genre": genres[5], "color": colors[5] },
               { "id": 6, "genre": genres[6], "color": colors[6] },
               { "id": 7, "genre": genres[7], "color": colors[7] },
               { "id": 8, "genre": genres[8], "color": colors[8] },
               { "id": 9, "genre": genres[9], "color": colors[9] },
               { "id": 10, "genre": genres[10], "color": colors[10] },
               { "id": 11, "genre": genres[11], "color": colors[11] },
               { "id": 12, "genre": genres[12], "color": colors[12] },
               { "id": 13, "genre": genres[13], "color": colors[13] },
               { "id": 14, "genre": genres[14], "color": colors[14] },
               { "id": 15, "genre": genres[15], "color": colors[15] },
               { "id": 16, "genre": genres[16], "color": colors[16] },
               { "id": 17, "genre": genres[17], "color": colors[17] }];

var legendsvg = d3.select("#charts-background").append("svg")
    .attr("transform", "translate(50, 10)")
    .attr("width", legendWidth + margin.left + margin.right)
    .attr("height", legendHeight);

legendsvg.append("g")
    .selectAll("rect")
    .data(legends)
    .enter().append("rect")
    .attr("class", "sqr")
    .attr("width", 15)
    .attr("height", 15)
    .attr("transform", function (d) {
      var x = Math.floor(d.id / 6) * 130;
      var y = d.id % 6 * 70;
      return "translate(" + x + ", " + y + ")";
    })
    .style("fill", function (d) {
      return d.color;
    });

legendsvg.append("g")
    .selectAll("text")
    .data(legends)
    .enter().append("text")
    .attr("class", "legendText")
    .attr("transform", "translate(15, 10)")
    .attr("x", function (d) {
      return Math.floor(d.id / 6) * 130;
    })
    .attr("y", function (d) {
      return d.id % 6 * 70;
    })
    .attr("dx", 10)
    .attr("dy", ".35em")
    .style("font-family", "Martel Sans")
    .style("font-size", "12px")
    .text(function(d) {
      return d.genre;
    });

