var OptionLib = (function(optionlib) {


  optionlib.daysToExpiry = function(options) {
    var daysToExpiry = [];

    for (i = 0; i < options.length; i++) {
      //Get 1 day in milliseconds
      var one_day = 1000 * 60 * 60 * 24;
      // Convert both dates to milliseconds
      var dateToday = new Date();
      var optionExpiryDate = new Date(options[i].expiry);
      // Calculate the difference in milliseconds
      var difference_ms = optionExpiryDate - dateToday;
      // Convert back to days and return
      daysToExpiry.push(Math.round(difference_ms / one_day))+1;
    }
    return daysToExpiry;
  }


  function singlePriceOptionPayoff(strike, premium, price, side, type) {
    var payoff = [];

    if (type.toUpperCase() === 'CALL')
      payoff.push(((Math.max(price - strike, 0)) - (premium)) * side);
    else
      payoff.push(((Math.max(strike - price, 0)) - (premium)) * side);
    return payoff;
  }


  function optionPayoff(option, meta) {
    var premium = (option.side.toUpperCase() === 'BUY') ? option.ask : option.bid;
    var side = (option.side.toUpperCase() === 'BUY') ? 1 : -1;
    var strike = option.strike;
    var type = option.type;
    var payoff = [];

    for (var ic in meta.priceRange)
      payoff.push(singlePriceOptionPayoff(strike, premium, meta.priceRange[ic], side, type));

    return payoff;
  }


  function optionStrategyPayoff(options, meta) {
    var payoff = [];
    var individualPayoffs = [];

    for (var i = 0; i < options.length; i += 1)
      individualPayoffs.push(optionPayoff(options[i], meta));

    for (var io = 0; io < meta.priceRange.length; io = io + 1) {
      var pay = 0;
      for (var ip = 0; ip < options.length; ip = ip + 1)
        pay += +individualPayoffs[ip][io];
      payoff.push(pay);
    }
    return payoff;
  }


  optionlib.payoff = function(options, meta) {
    var returnObject = {};
    var payoffAtCurrentPrice = {};

    returnObject.meta = meta;
    returnObject.options = options;

    if (options.length === 0)
      return returnObject;

    if (meta.hasOwnProperty('underlyingPrice') === true) {
      if (meta.hasOwnProperty('priceRange') === false) {
        if (meta.hasOwnProperty('minimumPrice') === true && meta.hasOwnProperty('maximumPrice') === true && meta.hasOwnProperty('priceIncrement') === true)
          meta.priceRange = calculatePriceRange(meta.underlyingPrice, +meta.minimumPrice, +meta.maximumPrice, +meta.priceIncrement);
        else
          meta.priceRange = calculatePriceRange(meta.underlyingPrice, +meta.underlyingPrice - 15, +meta.underlyingPrice + 15, +0.5);
      }
      payoffAtCurrentPrice = optionStrategyPayoff(options, {
        underlyingPrice: meta.underlyingPrice,
        priceRange: [meta.underlyingPrice]
      })[0]
      returnObject.payoffAtCurrentPrice = payoffAtCurrentPrice;
    }

    returnObject.payoff = optionStrategyPayoff(options, meta);

    return returnObject;
  }

  function calculatePriceRange(currentPrice, miniumPrice, maximumPrice, priceIncrement) {
    var rangeDistance = 15;
    var rangeIncrement = 0.25;
    var priceRange = [];
    //unary plus operator to convert them to numbers first.
    for (var i = (+miniumPrice); i < (+maximumPrice); i = i + +priceIncrement) {
      priceRange.push(i);
    }
    return priceRange;
  }

  
  

  /* Returns probability of occuring below and above target price. */
  optionlib.probability = function(price, target, days, volatility) {

    var p = price;
    var q = target;
    var t = days / 365;
    var v = volatility;

    var vt = v * Math.sqrt(t);
    var lnpq = Math.log(q / p);

    var d1 = lnpq / vt;

    var y = Math.floor(1 / (1 + 0.2316419 * Math.abs(d1)) * 100000) / 100000;
    var z = Math.floor(0.3989423 * Math.exp(-((d1 * d1) / 2)) * 100000) / 100000;
    var y5 = 1.330274 * Math.pow(y, 5);
    var y4 = 1.821256 * Math.pow(y, 4);
    var y3 = 1.781478 * Math.pow(y, 3);
    var y2 = 0.356538 * Math.pow(y, 2);
    var y1 = 0.3193815 * y;
    var x = 1 - z * (y5 - y4 + y3 - y2 + y1);
    x = Math.floor(x * 100000) / 100000;

    if (d1 < 0) {
      x = 1 - x
    }

    var pbelow = Math.floor(x * 1000) / 10;
    var pabove = Math.floor((1 - x) * 1000) / 10;

    return [pbelow, pabove];
  }


  optionlib.blackScholes = function(type, underlyingPrice, strike, riskFreeRate, volitility, timeToMaturity) {
    var call = (String(type).toLowerCase() === 'call') ? true: false;
    // type = call or put
    // S = stock prics, X = strike price, r = no-risk interest rate
    // v = volitility (1 std dev of S for (1 yr? 1 month?, you pick)
    // t = time to maturity

    // define some temp vars, to minimize function calls
    var sqt_ttm = Math.sqrt(timeToMaturity);
    var Nd2; //N(d2), used often
    var nd1; //n(d1), also used often
    var ert; //e(-rt), ditto
    var delta; //The delta of the option

    var d1 = (Math.log(underlyingPrice / strike) + riskFreeRate * timeToMaturity) / (volitility * sqt_ttm) + 0.5 * (volitility * sqt_ttm);
    var d2 = d1 - (volitility * sqt_ttm);

    if (call) {
      delta = optionlib.N(d1);
      Nd2 = optionlib.N(d2);
    } else { //put
      delta = -optionlib.N(-d1);
      Nd2 = -optionlib.N(-d2);
    }

    ert = Math.exp(-riskFreeRate * timeToMaturity);
    nd1 = optionlib.ndist(d1);

    var gamma = nd1 / (underlyingPrice * volitility * sqt_ttm);
    var vega = underlyingPrice * sqt_ttm * nd1;
    var theta = -(underlyingPrice * volitility * nd1) / (2 * sqt_ttm) - riskFreeRate * strike * ert * Nd2;
    var rho = strike * timeToMaturity * ert * Nd2;

    var bs_price =  (underlyingPrice * delta - strike * ert * Nd2);
    
    return {
      "bs_price":bs_price,
      "delta": delta,
      "gamma": gamma,
      "vega": vega,
      "theta": theta,
      "rho": rho
    }

  }


  optionlib.impliedVolatility = function(type, underlyingPrice, strike, riskFreeRate, timeToMaturity, optionPrice) {
    // call = Boolean (to calc call, call=True, put: call=false)
    // S = stock prics, X = strike price, r = no-risk interest rate
    // t = time to maturity
    // o = option price
    var sqt_ttm = Math.sqrt(timeToMaturity);
    var MAX_ITER = 100;
    var ACC = 0.0001;

    var sigma = (optionPrice / underlyingPrice) / (0.398 * sqt_ttm);
    for (i = 0; i < MAX_ITER; i++) {
      var price = optionlib.blackScholes(type, underlyingPrice, strike, riskFreeRate, sigma, timeToMaturity);
      var diff = optionPrice - price.bs_price;
      if (Math.abs(diff) < ACC) return sigma;
      var d1 = (Math.log(underlyingPrice / strike) + riskFreeRate * timeToMaturity) / (sigma * sqt_ttm) + 0.5 * sigma * sqt_ttm;
      var vega = underlyingPrice * sqt_ttm * optionlib.ndist(d1);
      sigma = sigma + diff / vega;
    }
    return "Error, failed to converge";

  }



  optionlib.call_iv = function(s, x, r, t, o) {
    return optionlib.implied_volatility(true, s, x, r / 100, t / 365, o)
  }

  optionlib.ndist = function(z) {
    return (1.0 / (Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * z);
  }


  optionlib.N = function(z) {
    var b1 = 0.31938153;
    var b2 = -0.356563782;
    var b3 = 1.781477937;
    var b4 = -1.821255978;
    var b5 = 1.330274429;
    var p = 0.2316419;
    var c2 = 0.3989423;
    var a = Math.abs(z);
    if (a > 6.0) {
      return 1.0;
    }
    var t = 1.0 / (1.0 + a * p);
    var b = c2 * Math.exp((-z) * (z / 2.0));
    var n = ((((b5 * t + b4) * t + b3) * t + b2) * t + b1) * t;
    n = 1.0 - b * n;
    if (z < 0.0) {
      n = 1.0 - n;
    }
    return n;
  }

  optionlib.intercept = function(priceRange, payoff) {
    var aboveZero = 0;
    var belowZero = 0;

    var crossOvers = [];
    var breakevens = [];

    for (i = 0; i < payoff.length; i++) {
      // Find all the places where the payoff changes sign 
      if (i > 1)
        if ((payoff[i] * payoff[i - 1]) < 0)
          crossOvers.push(i);
    }

    for (i = 0; i < crossOvers.length; i++) {
      var index = crossOvers[i];

      var sideApayoff = payoff[index];
      var sideBpayoff = payoff[index - 1];
      var sideAprice = priceRange[index];
      var sideBprice = priceRange[index - 1];
      var x1 = 0;
      var y1 = 0;
      var x2 = 0;
      var y2 = 1000;
      var x3 = sideAprice;
      var y3 = sideApayoff;
      var x4 = sideBprice;
      var y4 = sideBpayoff;

      breakevens.push(Math.abs(linecrossing(x1, y1, x2, y2, x3, y3, x4, y4)));
    }
    return breakevens;
  }


  function linecrossing(x1, y1, x2, y2, x3, y3, x4, y4) {
    var x12 = x1 - x2;
    var x34 = x3 - x4;
    var y12 = y1 - y2;
    var y34 = y3 - y4;

    var c = x12 * y34 - y12 * x34;

    if (Math.abs(c) < 0.01) {
      return -1;
    } else {
      // Intersection
      var a = x1 * y2 - y1 * x2;
      var b = x3 * y4 - y3 * x4;

      var x = (a * x34 - b * x12) / c;
      var y = (a * y34 - b * y12) / c;

      return y;
    }
  }

  return optionlib;

  //end private closure then run the closure, localized to My.Namespace
}(OptionLib || {}));





//  JavaScript adopted from Bernt Arne Odegaard's Financial Numerical Recipes
//  http://finance.bi.no/~bernt/gcc_prog/algoritms/algoritms/algoritms.html
//  by Steve Derezinski, CXWeb, Inc.  http://www.cxweb.com
//  Copyright (C) 1998  Steve Derezinski, Bernt Arne Odegaard
//
//  This program is free software; you can redistribute it and/or
//  modify it under the terms of the GNU General Public License
//  as published by the Free Software Foundation.

//  This program is distributed in the hope that it will be useful,
//  but WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
//  GNU General Public License for more details.
//  http://www.fsf.org/copyleft/gpl.html




function fraction(z) {
  // given a decimal number z, return a string with whole number + fractional string
  // i.e.  z = 4.375, return "4 3/8"

  var whole = Math.floor(z);
  var fract = z - whole;
  var thirtytwos = Math.round(fract * 32);
  if (thirtytwos === 0) {
    return whole + " ";
  } //(if fraction is < 1/64)
  if (thirtytwos === 32) {
    return whole + 1;
  } //(if fraction is > 63/64)

  //32's non-trivial denominators: 2,4,8,16
  if (thirtytwos / 16 == 1) {
    return whole + " 1/2";
  }

  if (thirtytwos / 8 == 1) {
    return whole + " 1/4";
  }
  if (thirtytwos / 8 == 3) {
    return whole + " 3/4";
  }

  if (thirtytwos / 4 == Math.floor(thirtytwos / 4)) {
    return whole + " " + thirtytwos / 4 + "/8";
  }

  if (thirtytwos / 2 == Math.floor(thirtytwos / 2)) {
    return whole + " " + thirtytwos / 2 + "/16";
  } else return whole + " " + thirtytwos + "/32";

} //end function

