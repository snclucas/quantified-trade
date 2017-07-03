var request = require('request');

exports.getQuoteData = function(req, res) {
  var symbol = req.params.symbol;
  if (typeof req.params.symbol === 'undefined') {

  }
var output = req.query.output;
   output = (typeof req.query.output === 'undefined') ? "web" : output;

  var options = {
    url: 'https://sandbox.tradier.com/v1/markets/quotes?symbols=' + symbol,
    headers: {
      'Accept': 'application/json',
      'Authorization': 'Bearer ' + process.env.TRADIER_API_KEY
    }
  };

  function callback(error, response, body) {
    if (error)
      res.json(error);

    if (!error && response.statusCode == 200) {
      var quoteData = JSON.parse(body);
      if (output == 'json')
        res.json(quoteData.quotes);
      else
        res.render('symbol', {
          quoteData: quoteData.quotes
        });
    } else {
      console.log(error);
    }
  }
  request(options, callback);
}