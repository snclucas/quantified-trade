var populateStrategyList = function(data) {
  console.log(data);
  $("#strategylisttable tr").remove();
  $("#stratlist li").remove();
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
        
        var newRow = '<li class="list-group-item"><div class="checkbox"><label for="checkbox">' + 
            '<a href="/optionchain?symbol=' + symbol + '&expiry=' + strategyExpiry + '&strategyid=' + strategyID + '">' +
          '<div><strong>' + symbol + ' | ' + strategyName + '</strong> | ' + strategyDesc + '</div>' +
          '</a>' +
            '</label></div>' +
            '<div class="pull-right action-buttons">' +
            '<span class="glyphicon glyphicon-trash" id="delete_strategy" data-strategy-id="' + strategyID + '" ></span>' +
            '</div></li>';
        $("#stratlist").append(newRow);
      });
    });
  } else {
    var newRow = '<tr><td>' +
      'You have no strategies' +
      '</td></tr>';
    $("#strategylisttable").append(newRow);
  }
}


var getStrategies = function() {
  $.get('/strategy?grouped=true', populateStrategyList);
}


$(function() {
  getStrategies();
})






/* Populate the expirations in the add strategy modal */
$("#symbol_input").focusout(function() {
  var symbol = $('#symbol_input').val();
  $.get('/optionexpirations/' + symbol, function(data) {
    if (data.status > 0 && data.data.expirations != null) {
      $("#expiry_input option").remove();
      var expirations = data.data.expirations.date;
      $.each(expirations, function(key, expiry) {
        console.log(key);
        var option = '<option>' + expiry + '</option>';
        $("#expiry_input").append(option);
      });
    } else {
      var option = '<option>No expirations found for symbol entered!</option>';
      $("#expiry_input").append(option);
    }
  });


});



$(function() {
  $('body').on('click', '#delete_strategy', function(e) {
    e.preventDefault();

    var strategy_id = $(this).data("strategy-id");
    console.log(strategy_id);

    $.ajax({
      type: 'POST',
      url: '/strategy/delete/'+strategy_id,
      dataType: "json",
      async: true,
      success: getStrategies()
    });

  });

});



