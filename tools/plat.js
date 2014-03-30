var page = require('webpage').create();
page.viewportSize = {
    width: 1200,
    height: 600
};
page.open('http://www.html-js.com/topic/128?is_clear=1', function() {
    page.render('example.pdf');
    phantom.exit();
});