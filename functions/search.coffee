SearchHis = __M 'search_his'
SearchHis.sync()
config = require './../config.coffee'
hises = {}
hisestime = 0
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
  addHis:(data,callback)->
    SearchHis.find
      where:
        word:data.word
    .success (w)->
      if w
        w.updateAttributes
          count:w.count+1
      else if w.length>2
        SearchHis.create({
          word:data.word
          count:1
        })
  getAll:(page,count,condition,order,include,callback)->
    if arguments.length == 4
      callback = order
      order = null
      include = null
    else if arguments.length == 5
      callback = include
      include = null
    query = 
      offset: (page - 1) * count
      limit: count
      order: order || "id desc"
      raw:true
    if condition then query.where = condition
    if include then query.include = include
    nowtime = new Date().getTime()
    if nowtime- hisestime <1000*60*60*24 && hises[page*count]
      callback null,hises[page*count]
    else
      hisestime = nowtime
      SearchHis.findAll(query)
      .success (ms)->
        hises[page*count] = ms
        callback null,ms
      .error (e)->
        callback e
__FC search,SearchHis,['count']      


module.exports = search