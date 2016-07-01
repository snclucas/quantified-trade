var request = require('request');


exports.getOptionExpiriesForSymbol = function(req, res) {
  var symbol = req.params.symbol;

  var options = {
    url: process.env.TRADIER_URL + '/markets/options/expirations?symbol=' + symbol,
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + process.env.TRADIER_API_KEY
    }
  };

  function callback(error, response, body) {
    if (!error && response.statusCode == 200) {
      var optionChainData = JSON.parse(body);
      res.json(optionChainData);
    } else {
      res.json({
        expirations: null,
        error: error
      });
    }
  }
  request(options, callback);
};


exports.getOptionChainData = function(req, res) {
  var symbol = req.query.symbol;
  var expiry = req.query.expiry;
  var output = req.query.output;
  output = (typeof req.query.output === 'undefined') ? "web" : output;

  var listtype = req.query.listtype;
  listtype = (typeof req.query.listtype === 'undefined') ? "single" : listtype;

  var viewoption = req.query.viewoption;
  viewoption = (typeof req.query.viewoption === 'undefined') ? "0" : viewoption;

  var optionType = req.query.type;
  optionType = (typeof req.query.type === 'undefined') ? "call" : optionType;

  var side = req.query.side;
  side = (typeof req.query.side === 'undefined') ? "buy" : side;

  var strategyid = req.query.strategyid;
  strategyid = (typeof req.query.strategyid === 'undefined') ? "" : strategyid;

  var optionso = {
    url: process.env.TRADIER_URL + '/markets/options/chains?symbol=' + symbol + '&expiration=' + expiry,
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + process.env.TRADIER_API_KEY
    }
  };

  request(optionso, function(error, response, body) {
    var status = null;
    var optionChainData = null;
    
    console.log("error = " + error);
    console.log("response.statusCode = " + response.statusCode);

    if (!error && response.statusCode == 200)
      optionChainData = JSON.parse(body);
    else
      optionChainData = {
        calls: [],
        puts: []
      };
    
    var rawOptionChainData = optionChainData;

    var optionsq = {
      url: process.env.TRADIER_URL + '/markets/quotes?symbols=' + symbol,
      headers: {
        'Accept': 'application/json',
        'Authorization': 'Bearer ' + process.env.TRADIER_API_KEY
      }
    };

    request(optionsq, function(error, response, body) {

      var quoteData = null;
      if (!error && response.statusCode == 200)
        quoteData = JSON.parse(body);

      if (quoteData.quotes.hasOwnProperty('unmatched_symbols'))
        quoteData = null;

      var daysToExpiry = 0;
      if (optionChainData.options !== null && quoteData !== null) {
        quoteData = quoteData.quotes.quote;
        optionChainData = processOptionChain(rawOptionChainData.options.option);
        daysToExpiry = daysBetween(new Date(), new Date(expiry));
      }

      var returnData = {
        status: 1,
        symbol: symbol,
        listtype: listtype,
        expiry: expiry,
        daysToExpiry: daysToExpiry,
        side: side,
        quote: quoteData !== null ? quoteData : {},
        optionIndex: viewoption,
        options: optionChainData,
        options_js: JSON.stringify(optionChainData),
        strategyid: strategyid,
      };

      if (output == 'json')
        res.json(returnData);
      else
        res.render('optionchain.ejs', returnData);
    });
  });
};



function processOptionChain(optionChain) {
   var optionChainData = {};
   optionChainData.calls = [];
   optionChainData.puts = []; 
  
   for (var optionIndex in optionChain) {
     var option = {
       symbol: optionChain[optionIndex].root_symbol,
       strike: optionChain[optionIndex].strike,
       bid: optionChain[optionIndex].bid,
       ask: optionChain[optionIndex].ask,
       type: optionChain[optionIndex].option_type,
       expiry: optionChain[optionIndex].expiration_date,
       open_interest: optionChain[optionIndex].open_interest,
     };

     if(optionChain[optionIndex].option_type.toUpperCase() === "CALL") 
       optionChainData.calls.push(option);
     else 
       optionChainData.puts.push(option);
   }
  return optionChainData;
}



function daysBetween(date1, date2) {
  //Get 1 day in milliseconds
  var one_day = 1000 * 60 * 60 * 24;

  // Convert both dates to milliseconds
  var date1_ms = date1.getTime();
  var date2_ms = date2.getTime();

  // Calculate the difference in milliseconds
  var difference_ms = date2_ms - date1_ms;

  // Convert back to days and return
  return Math.round(difference_ms / one_day);
}

