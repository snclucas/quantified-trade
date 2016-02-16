var OptionStrategy = require('../models/optionstrategy');

exports.getAllOptionStrategiesForUser = function(req, res) {
  // Get the authenticated user
  var user = req.user;
  var symbol = req.query.symbol;
  symbol = (typeof req.query.symbol === 'undefined') ? "" : symbol;
  
  var grouped = req.query.grouped;
  grouped = (typeof req.query.grouped === 'undefined') ? false : grouped;
  
  var criteria = {};
  if(symbol === "") {
    criteria = {'user': user,};
  }
  else {
    criteria = {'user': user, 'symbol': symbol};
  }

  OptionStrategy.find(criteria, function(err, strategies) {
    if (err || !strategies.length) {
      res.json({
        status: 0,
        strategies: [{
          id: 0,
          name: 'No strategies found for user'
        }]
      });
    } else {
      var returnStrategies = strategies;
      if(grouped)
        returnStrategies = groupStrategiesBySymbol(strategies);
        
      res.json({
        status: 1,
        strategies: returnStrategies
      });
    }
  });
}


/* 
Create array of strategies grouped by symbol
*/
function groupStrategiesBySymbol(strategies) {
  var organizedStrategies = {};

  for (var i in strategies) {
    if (typeof organizedStrategies[strategies[i].symbol] === 'undefined')
      organizedStrategies[strategies[i].symbol] = [];

    organizedStrategies[strategies[i].symbol].push(strategies[i]);
  }
  return organizedStrategies;
}


exports.getUserStrategy = function(req, res) {
  var strategyID = req.params.strategyid;
  var currentPrice = req.query.current_price;
  var user = req.user;

  OptionStrategy.findOne({
    '_id': strategyID,
    'user': user
  }, function(err, strategy) {
    if (err)
      res.send(err);

    res.json({
      strategy: strategy,
    });
  });
}


exports.deleteOptionFromStrategy = function(req, res) {
  var id = req.params.strategyid;
  var optionid = req.params.optionid;

  if (id === "")
    res.json({
      staus: -1,
      message: "Could not find option strategy with ID " + id
    });

  OptionStrategy.findOne({
    _id: id
  }, function(err, optionStrategy) {
    if (err) {
      res.send(err);
    }
    // console.log(optionStrategy);
    // handle errors ..
    optionStrategy.strategyoptions.pull({
      _id: optionid
    });

    optionStrategy.save(function(err, optionStrategy) {
      if (err) {
        res.send(err);
      }
      res.json(optionStrategy);
    });

  })
}



exports.deleteAllOptionsFromStrategy = function(req, res) {
  var id = req.params.strategyid;

  if (id === "")
    res.json({
      staus: -1,
      message: "Could not find option strategy with ID " + id
    });

  OptionStrategy.findOne({
    _id: id
  }, function(err, optionStrategy) {
    if (err) {
      res.send(err);
    }
    // console.log(optionStrategy);
    // handle errors ..
    optionStrategy.strategyoptions.pull({
    });

    optionStrategy.save(function(err, optionStrategy) {
      if (err) {
        res.send(err);
      }
      res.json(optionStrategy);
    });

  })
}




exports.setSideOfStrategyOption = function(req, res) {
  var strategyid = req.params.strategyid;
  var optionid = req.params.optionid;
  var buysell = req.params.buysell;

  if (strategyid === "")
    res.json({
      staus: -1,
      message: "Could not find option strategy with ID " + strategyid
    });

  OptionStrategy.update({
      "_id": strategyid,
      "strategyoptions._id": optionid
    }, {
      $set: {
        "strategyoptions.$.side": buysell
      }
    },
    function(err, optionStrategy) {

      res.json(optionStrategy);
    }
  );
}



exports.addOptionToStrategy = function(req, res) {
  var id = req.params.strategyid;
  var option = req.body.option;

  if (id === "")
    res.json({
      staus: 'Error',
      message: "Could not find option strategy with ID " + id
    });

  OptionStrategy.findOne({
    _id: id
  }, function(err, optionStrategy) {
    if (err) {
      console.log(err);
      res.send(err);
    }
    // handle errors ..
    optionStrategy.strategyoptions.push(option);

    optionStrategy.save(function(err, optionStrategy) {
      if (err) {
        console.log(err);
        res.send(err);
      }
      res.json(optionStrategy);
    });

  })
}


exports.addOptionStrategy = function(req, res) {
  var name = req.body.strategyname;
  var description = req.body.strategydescription;
  var symbol = req.body.symbol;
  var expiry = req.body.expiry;

  var user = req.user;

  // create a new user
  var newOptionStrategy = OptionStrategy({
    name: name,
    description: description,
    symbol: symbol,
    expiry: expiry,
    user: user
  });

  newOptionStrategy.save(function(err) {
    if (err) throw err;

    res.redirect('/optionchain?symbol=' + symbol + '&expiry=' + expiry + "&strategyid=" + newOptionStrategy._id);
  });

};