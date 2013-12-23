childProcess = require('child_process')
phantomjs = require('phantomjs')
binPath = phantomjs.path





module.exports = 
  create_article:(article_id,callback)->
    childArgs = [
      './lib/phantom.js'
      article_id
    ]
    childProcess.execFile binPath, childArgs,(err, stdout, stderr)->
      console.log stdout
      console.log stderr
      callback&&callback()