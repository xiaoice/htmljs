func_allcount = 
  data:
    card:0
    user:0
    article:0
    column:0
    question:0
    topic:0
  last_check:0
  init:()->
    this.last_check = new Date().getTime()
    (__F 'card').count null,(error,count)->
      func_allcount.data.card = count
    (__F 'user').count null,(error,count)->
      func_allcount.data.user = count
    (__F 'article/article').count null,(error,count)->
      func_allcount.data.article = count
    (__F 'column').count null,(error,count)->
      func_allcount.data.column = count
    (__F 'question').count null,(error,count)->
      func_allcount.data.question = count
    (__F 'topic').count null,(error,count)->
      func_allcount.data.topic = count
  check:(name)->
    (__F name).count null,(error,count)->
      func_allcount.data[name] = count
  getData:()->
    now = new Date().getTime()
    if now-this.last_check>1000*60*60
      this.init()
    return this.data;

func_allcount.init()
module.exports = func_allcount