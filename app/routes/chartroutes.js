var chartService = require('../services/ChartService');

module.exports = function(app) {
 app.get('/chart', isLoggedIn, chartService.getHistoricalData);
}


// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();

  res.redirect('/');
}