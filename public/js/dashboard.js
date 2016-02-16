// Get all user strategies
$.get('/strategy?grouped=true', function(data) {
  $("#strategylisttable tr").remove();
  if (data.status > 0) {
    var strategies = data.strategies;
    // Set up the list of options in strategy
    
    $.each(strategies, function(key, value) {
      var symbol = key;

      $.each(value, function(key, strategy) {
        var strategyName = strategy.name;
        var strategyID = strategy._id;
        var strategyDesc = strategy.description;
        var strategyExpiry = strategy.expiry;
        if (strategyDesc === '')
          strategyDesc = 'No description';

        // Construct the table
        var newRow = '<tr>'+
          '<td>' +
          '<a href="/optionchain?symbol=' + symbol + '&expiry=' + strategyExpiry + '&strategyid=' + strategyID + '">' +
          '<div><strong>' + symbol + ' | ' + strategyName + '</strong> | ' + strategyDesc + '</div>' +
          '</a>' +
          '</td></tr>';
        $("#strategylisttable").append(newRow);
      });
    });
  }
  else {
    var newRow = '<tr><td>' +
          'You have no strategies' +
          '</td></tr>';
        $("#strategylisttable").append(newRow);
  }
});