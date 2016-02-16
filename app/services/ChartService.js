var request = require('request');

function formatDate(date) {
    var d = new Date(date),
        month = '' + (d.getMonth() + 1),
        day = '' + d.getDate(),
        year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}


function formatData(jsonData) {
  var data = [];
  for (var i = 0; i < jsonData.length; i++) {
    var candleData = [];
    var timeStamp =  new Date(jsonData[i].date).getTime();
    candleData.push(timeStamp, jsonData[i].open, jsonData[i].high, jsonData[i].low, jsonData[i].close);
    data.push(candleData);
  }
  return data;
}


exports.getHistoricalData = function(req, res) {
  var symbol = req.query.symbol;
  if(typeof req.query.symbol === 'undefined') {
    
  }

  var interval = req.query.interval;
  interval = (typeof req.query.interval === 'undefined') ? "daily" : interval;
  
  var year = new Date().getFullYear();
  var month = new Date().getMonth();
  var day = new Date().getDate();

  var start = req.query.start;
  start = (typeof req.query.type === 'undefined') ? formatDate([year-1, month, day].join('-')) : start;

  var end = req.query.end;
  end = (typeof req.query.end === 'undefined') ? formatDate([year, month, day].join('-')) : end;
  
  var options = {
    url: 'https://sandbox.tradier.com/v1/markets/history?symbol=' + symbol + "&interval=" + interval + "&start=" + start + "&end=" + end,
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + process.env.TRADIER_API_KEY
    }
  };
  
  function callback(error, response, body) {
    if(error)
      res.json(error);
    
    if (!error && response.statusCode == 200) {
      var historicalData = JSON.parse(body);
      res.render('chart', {
        symbol: symbol,
        candledata: formatData(historicalData.history.day)
      });
    } else {
      console.log(error);
    }
  }
  request(options, callback);
}



