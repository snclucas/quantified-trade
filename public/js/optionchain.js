/* 
Called to initialize the options strategy panel
*/
var initScreen = function() {
	$("#optionstrategy").hide()
	$("#nooptionstrategy").show()
}

/*
Populate the option strategy table
*/
var populateOptionStrategy = function(stratID) {
	if (stratID === "")
		return;

	$.get('/strategy/' + stratID + '?current_price=' + QTAPP.currentPrice, function(data) {
		var strategy = data.strategy;

		// Hide option strategy if no options present
		var numberOfOptions = strategy.strategyoptions;
		
		if (numberOfOptions.length === 0) {
			$("#optionstrategy").hide();
			$("#nooptionstrategy").show();
		} else {
			$("#optionstrategy").show();
			$("#nooptionstrategy").hide();
		}

		// Set up the list of options in strategy

		$("#optionstrategytable tr").remove();

		if (numberOfOptions.length !== 0) {
			//Set the name of the strategy
			$("#strategy-name span").remove();
			$("#strategy-name").append('<span>' + strategy.name + '</span>');

			$("#strategy-desc span").remove();
			$("#strategy-desc").append('<span>' + strategy.description + '</span>');

			// Sum up the premiums
			var sum = 0;

			// Loop over the stratey options
			$.each(strategy.strategyoptions, function(key, value) {
				var premium = 100 * ((value.side.toUpperCase() === 'BUY') ? value.ask : -1 * value.bid)
				sum += +premium;
				
				var timeToExpiry = OptionLib.daysToExpiry([value]);
				var IV = OptionLib.impliedVolatility(value.side, QTAPP.currentPrice, value.strike, 
																						 0.001, timeToExpiry[0], 
																						 ((value.side.toUpperCase() === 'BUY') ? value.ask : value.bid));
				
				var BS = OptionLib.blackScholes(value.side, QTAPP.currentPrice, value.strike, QTAPP.riskFreeRate, IV, timeToExpiry[0]);
				
				console.log(IV + " " + BS.bs_price + " " + BS.delta + " " + BS.vega);
				
				// Switch buy/sell button
				var buySellBoxColor = (value.side.toUpperCase() === 'BUY') ? 'btn-success' : 'btn-danger';
				var expiry = new Date(value.expiry);

				// Construct the strategy options table
				var newRow = '<tr>' +
					'  <td rowspan="2" class="text-center vert-align">' + value.type.capitalize() + '</td>' +
					'  <td class="text-center vert-align">' + value.strike + '</td>' +
					'  <td rowspan="2" class="text-center vert-align">' + (expiry.getMonth() + 1) + "-" + expiry.getDate() + "-" + expiry.getFullYear() + '</td>' +
					'  <td rowspan="2" class="text-center vert-align">$' + premium.toFixed(1) + '</td>' +
					'  <td rowspan="2" class="text-center vert-align">' +
					'  <button id="optside"  class="btn ' + buySellBoxColor + ' btn-xs" data-optionside="' + value.side + '" data-optionid="' + value._id + '" data-toggle="toggle">' + value.side.toUpperCase() + '</button>' +
					'  </td>' +
					'  <td rowspan="2" class="text-center vert-align">' +
					'    <button id="delopt" class="btn btn-danger btn-xs" data-optionid="' + value._id + '" ><span class="spinner"><i class="icon-spin icon-refresh"></i></span><span class="glyphicon glyphicon-trash"></span></button>' +
					'  </td class="text-center">' +
					'</tr>' +
					'<tr>' +
					'  <td class="text-center">' +
					'    <button class="btn btn-xs btn-danger "><i class="fa fa-arrow-up"></i></span></button>&nbsp;' +
					'    <button class="btn btn-xs btn-danger "><i class="fa fa-arrow-down"></i></span></button>' +
					'  </td>' +
					'</tr>';
				$("#optionstrategytable").append(newRow);
			});
			// Add a row at the end summing the premiums
			var sumRow = '<tr><td></td><td></td><td></td>' +
				'<td class="text-center"><strong>$' + sum.toFixed(2) + '</strong></td>' +
				'<td class="text-center">' +
				'  <button id="swapsides" class="btn btn-info"><span class="glyphicon glyphicon-random"></span></button>' +
				'</td><td></td></tr>';


			$("#optionstrategytable").append(sumRow);

			// Calculate the payoff data for the options in the strategy
			var payoffData = OptionLib.payoff(strategy.strategyoptions, {
				underlyingPrice: QTAPP.currentPrice
			});

			// Now calculate the breakvens (where the payoff crosses the x-axis)
			$("#breakevenstable tr").remove();
			var breakevens = OptionLib.intercept(payoffData.meta.priceRange, payoffData.payoff);

			// Calculate the number of days until expiry (used to calcualte probabilities)
			var daysToExpiry = OptionLib.daysToExpiry(strategy.strategyoptions);

			// Construct the breakevens table
			for (i = 0; i < breakevens.length; i++) {
				var probToReachBreakEven = OptionLib.probability(QTAPP.currentPrice, breakevens[i], daysToExpiry[i], 0.2);
				var probability = 0;
				if (QTAPP.currentPrice > breakevens[i])
					probability = probToReachBreakEven[0]; //e need the probability it will be below
				else
					probability = probToReachBreakEven[1]; //e need the probability it will be above
				var newBreakEvensRow = '<tr><td class="text-center">' + breakevens[i].toFixed(2) + '</td> <td class="text-center">' + probability + '%</td></tr>';
				$("#breakevenstable").append(newBreakEvensRow);
			}



			// Construct the chart
			createChart(strategy, payoffData.payoff, payoffData.meta.priceRange, QTAPP.currentPrice, payoffData.payoffAtCurrentPrice);
		}

		//Set the global strategyid and change the URL to reflect the new strategy ID
		QTAPP.strategyID = strategy._id;
		var newurl = updateQueryStringParameter(window.location.href, 'strategyid', strategy._id);
		window.history.pushState('{}', '', newurl);
	});
};


String.prototype.capitalize = function() {
	return this.charAt(0).toUpperCase() + this.slice(1);
}

var populateOptionStrategyCallBack = function(event) {
	populateOptionStrategy(event.target.value);
}

/* Called when user changes strategy */
jQuery(document).ready(function($) {
	$('select').on('change', populateOptionStrategyCallBack)
});


/* Delete an option from a strategy */
var deleteOptionFromStrategy = function(event) {
	event.preventDefault();
	toggleSpinner('active');
	var optionid = $(this).data("optionid");
	var strategid = QTAPP.strategyID;

	$.ajax({
		type: 'POST',
		contentType: 'application/json',
		url: '/strategy/' + strategid + '/delete/option/' + optionid,
		success: function(data) {
			populateOptionStrategy(strategid);
			toggleSpinner('active');
		},
		error: function(response) {
			toggleSpinner('active');
		}
	});
}


function toggleSpinner(state) {
	$('#strategy-name-button').toggleClass(state);
}


$('body').on('click', '#delopt', deleteOptionFromStrategy);


$('body').on('click', '#optside', changeOptionBuyOrSell);


function updateQueryStringParameter(uri, key, value) {
	var re = new RegExp("([?&])" + key + "=.*?(&|$)", "i");
	var separator = uri.indexOf('?') !== -1 ? "&" : "?";
	if (uri.match(re)) {
		return uri.replace(re, '$1' + key + "=" + value + '$2');
	} else {
		return uri + separator + key + "=" + value;
	}
}


function getUserStrategies() {
	toggleSpinner('active');
	var status = 0;
	$.get('/strategy?symbol=' + QTAPP.symbol, function(data) {
		//	if(data.status > 0) {//0= no strategies, -1 bad request
		status = data.status;
		var firstStrategyID = 'undefined';
		$.each(data.strategies, function(key, value) {
			if (firstStrategyID === 'undefined')
				firstStrategyID = value._id

			var symbolVar = '<%= symbol %>';
			var expiryVar = '<%= expiry %>';
			var active = (value._id === QTAPP.strategyID) ? " selected" : "";
			var newEntry = '<option value="' + value._id + '"' + active + '>' + value.name + '</option>';
			$("#dropDownUserStrategies").append(newEntry);
		});
		if (QTAPP.strategyID === "")
			QTAPP.strategyID = firstStrategyID;

		if (data.status > 0) //0= no strategies, -1 bad request
			populateOptionStrategy(QTAPP.strategyID);

		toggleSpinner('active');
	});
}



$(function() {
	$('.addoption').click(function(e) {
		e.preventDefault();

		// Get the option index from the option table (data-optionindex)
		var optionindex = $(this).data("optionindex");
		// Get the option type (call/put) from the option table (data-optiontype)
		var optiontype = $(this).data("optiontype");

		// Get the option on the appropriate side of the option chain table
		var option = {};
		if (optiontype.toUpperCase() === 'CALL')
			option = QTAPP.options.calls[optionindex];
		else
			option = QTAPP.options.puts[optionindex];

		// Construct a simple option object to persist into the strategy object
		var simpleOptionObject = {
			symbol: option.symbol,
			bid: option.bid,
			ask: option.ask,
			strike: option.strike,
			expiry: option.expiry,
			type: option.type,
			side: 'buy'
		};

		var data = {
			option: simpleOptionObject
		};

		toggleSpinner('active');
		$.ajax({
			type: 'POST',
			data: JSON.stringify(data),
			contentType: 'application/json',
			url: '/strategy/add/option/' + QTAPP.strategyID,
			success: function(data) {
				populateOptionStrategy(QTAPP.strategyID);
				toggleSpinner('active');
			},
			error: function(response) {
				toggleSpinner('active');
			}
		});
	});
});



/* Change the side (buy/sell) of an option within a strategy */
function changeOptionBuyOrSell(e) {
	// Tell the user we are busy doing something
	toggleSpinner('active');
	e.preventDefault();

	// Get the option id from the strategy option table (data-optionid)
	var optionid = $(this).data("optionid");

	//Need to reverse the buy/sell as this should be toggling the buy/sell after user click
	var optionside = ($(this).data("optionside").toUpperCase() === 'BUY') ? 'sell' : 'buy';

	var strategyid = QTAPP.strategyID;
	// Set up data bdy for POST
	var data = {
		strategyid: QTAPP.strategyID,
		optionid: optionid,
		newSide: optionside
	};

	$.ajax({
		type: 'POST',
		data: JSON.stringify(data),
		contentType: 'application/json',
		//url: '/setsideofstrategyoption',
		url: '/strategy/' + strategyid + '/option/' + optionid + '/setbuysell/' + optionside,
		success: function(data) {
			populateOptionStrategy(QTAPP.strategyID);
			// Tell the user we are done
			toggleSpinner('active');
		},
		error: function(response) {
			// Tell the user we are done
			toggleSpinner('active');
		}
	});

}



function createChart(strategy, payoff, priceRange, currentPrice, payoffAtCurrentPrice) {

	if (strategy.strategyoptions.length > 0) {

		$(function() {
			$('#payoffchartcontainer').highcharts({

				title: {
					text: ''
				},

				legend: {
					enabled: false
				},

				xAxis: {
					data: [priceRange],
					title: {
						text: 'Underlying Price ($)'
					},

					min: Math.min.apply(Math, priceRange),
					max: Math.max.apply(Math, priceRange),

				},

				yAxis: {
					title: {
						text: 'Payoff ($)'
					},
					lineColor: '#000000',
					lineWidth: 3,
					gridLineWidth: 0,
					min: Math.min.apply(Math, payoff),
					max: Math.max.apply(Math, payoff),
					plotLines: [{
						value: 0,
						width: 3,
						color: '#000000',
						dashStyle: "Solid"
					}]
				},

				series: [{
					data: [],
					marker: {
						fillColor: 'rgba(255,0,0,.5)',
						radius: 0,
						symbol: 'circle'
					},
				}, {
					data: [
						[+currentPrice, +payoffAtCurrentPrice]
					],
					marker: {
						fillColor: 'rgba(255,0,0,.5)',
						radius: 8,
						symbol: 'circle'
					},

				}]

			}, function(chart) { // on complete
				//Format the series for highcharts
				var myData = payoff;
				var mySeries = [];
				for (var i = 0; i < myData.length; i++) {
					mySeries.push([priceRange[i], myData[i]]);
					i++
				}
				chart.series[0].setData(mySeries);
			});
		});

	}
}

$(function() {
	$.get('/optionexpirations/' + QTAPP.symbol, function(data) {
		$.each(data.expirations.date, function(key, value) {
			var newEntry = '<li><a href="\optionchain?symbol=' + QTAPP.symbol + '&expiry=' + value + '">' + value + '</li>';
			$("#dropDownExpirations").append(newEntry);
		});
	});
});