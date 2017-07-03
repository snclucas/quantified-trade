var symbolService = require('../services/SymbolService');

module.exports = function(app) {
app.get('/symbol/:symbol', isLoggedIn, symbolService.getQuoteData);
};

// route middleware to ensure user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated())
    return next();
  res.redirect('/');
}