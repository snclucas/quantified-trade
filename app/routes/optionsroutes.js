

var optionChainService = require('../services/OptionChainService');
var searchService = require('../services/SearchService');
var strategyService = require('../services/StrategyService');

module.exports = function(app) {

  app.param('symbol', function(req, res, next, symbol) {

    // check if the user with that name exists
    // do some validations
    var modified = symbol; // + 't';

    // save name to the request
    req.params.symbol = modified;

    next();
  });

  app.post('/strategy/add', isLoggedIn, strategyService.addOptionStrategy);
  app.post('/strategy/add/option/:strategyid', isLoggedIn, strategyService.addOptionToStrategy);
  app.post('/strategy/:strategyid/option/:optionid/setbuysell/:buysell', isLoggedIn, strategyService.setSideOfStrategyOption);

  app.post('/strategy/:strategyid/delete/option/:optionid', isLoggedIn, strategyService.deleteOptionFromStrategy);
  app.post('/strategy/:strategyid/delete/option/all', isLoggedIn, strategyService.deleteAllOptionsFromStrategy);

  app.get('/strategy', isLoggedIn, strategyService.getAllOptionStrategiesForUser);
  
  app.get('/strategy/:strategyid', isLoggedIn, strategyService.getUserStrategy);

  app.get('/optionexpirations/:symbol', /*isLoggedIn, */ optionChainService.getOptionExpiriesForSymbol);

  app.get('/optionchain', isLoggedIn, optionChainService.getOptionChainData);

  app.get('/search', /*isLoggedIn, */ searchService.search);
  
   app.get('/search', /*isLoggedIn, */ searchService.search);
};



// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();

  res.redirect('/');
}