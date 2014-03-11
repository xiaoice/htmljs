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
  create_card:(card_id,callback)->
    childArgs = [
      './lib/phantom/card.js'
      card_id
    ]
    childProcess.execFile binPath, childArgs,(err, stdout, stderr)->
      console.log stdout
      console.log stderr
      callback&&callback()
  create_topic:(topic_id,callback)->
    childArgs = [
      './lib/phantom/topic.js'
      topic_id
    ]
    childProcess.execFile binPath, childArgs,(err, stdout, stderr)->
      console.log stdout
      console.log stderr
      callback&&callback()
  create_column:(column_id,callback)->
    childArgs = [
      './lib/phantom/column.js'
      column_id
    ]
    childProcess.execFile binPath, childArgs,(err, stdout, stderr)->
      console.log stdout
      console.log stderr
      callback&&callback()        