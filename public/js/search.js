$('#example-6').selectivity({
  ajax: {
    url: 'https://api.github.com/search/repositories',
    dataType: 'json',
    minimumInputLength: 3,
    quietMillis: 250,
    params: function(term, offset) {
      // GitHub uses 1-based pages with 30 results, by default
      return {
        q: term,
        page: 1 + Math.floor(offset / 30)
      };
    },
    processItem: function(item) {
      return {
        id: item.id,
        text: item.name,
        description: item.description
      };
    },
    results: function(data, offset) {
      return {
        results: data.items,
        more: (data.total_count > offset + data.items.length)
      };
    }
  },
  placeholder: 'Search for a repository',
  templates: {
    resultItem: function(item) {
      return (
        '<div class="selectivity-result-item" data-item-id="' + item.id + '">' +
        '<b>' + escape(item.text) + '</b><br>' +
        escape(item.description) +
        '</div>'
      );
    }
  }
});