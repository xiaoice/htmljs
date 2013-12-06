SearchHis = __M 'search_his'
SearchHis.sync()
config = require './../config.coffee'
search  = 
  add:(data,callback)->
    childProcess = require('child_process')
    childProcess.execFile "php", [config.xunsearch_bin+"/action/add.php",encodeURIComponent(JSON.stringify(data))],(err, stdout, stderr)->
      console.log stdout
      callback(stderr,stdout)
  query:(data,callback)->
    SearchHis.find
      where:
        word:data.query
    .success (w)->
      if w
        w.updateAttributes
          count:w.count+1
      else
        SearchHis.create({
          word:data.query
          count:1
        })
          

    childProcess = require('child_process')
    childProcess.execFile "php", [config.xunsearch_bin+"/action/query.php",encodeURIComponent(JSON.stringify(data))],(err, stdout, stderr)->
      console.log stdout
      callback(stderr,stdout)

__FC search,SearchHis,['getAll','count']      


module.exports = search