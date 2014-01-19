var page = require('webpage').create();
  page.viewportSize = { width: 500, height: 600 };
page.open('http://www.html-js.com/topic/128?is_clear=1', function() {
  page.render('example.png');
  phantom.exit();
});
