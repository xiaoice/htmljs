xss = require('xss')
xss.whiteList['iframe'] = ['src', 'width','height','allowfullscreen','frameborder','id','class','style'];
console.log(xss('<pre src=""><script></script></pre>'))