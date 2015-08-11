// Read the Phantom webpage '#intro' element text using jQuery and "includeJs"

var page = require('webpage').create();

page.onConsoleMessage = function(msg) {
  console.log(msg);
};

page.open("http://www.dianping.com/search/category/2/10/g113", function(status) {
  if ( status === "success" ) {
    page.includeJs("http://libs.useso.com/js/jquery/2.1.1/jquery.min.js", function() {
      page.evaluate(function() {
        $('#shop-all-list').find('li').each(function() {
          var shop = $(this);
          var title = shop.find('.tit a').attr('title');
          var price = shop.find('.mean-price b').text();
          console.log(title + ': ' + price);
          /*var title = $('.shop-name').text();
          var local = $('.address').text();
          var tel = $('.tel').text();
          console.log(title + ' ' + local + ' ' + tel);*/
        })
      });
      phantom.exit();
    });
  }
});

