require './../lib/modelLoader.coffee'
require './../lib/functionLoader.coffee'
pinyin = require ("./../lib/PinYin.js")

request = require 'request'
en_func = (text,callback)->
  request.get "http://openapi.baidu.com/public/2.0/bmt/translate?client_id=GrnrtemxoSDbfogwohk6ka5V&from=zh&to=en&q="+text,(e,r,body)->
    console.log body
    en = null
    try
      result = JSON.parse body
      en = result.trans_result[0].dst
    catch e
      en = pinyin(text,{heteronym: false,style: pinyin.STYLE_NORMAL}).join("")
    callback en
pinyin("要翻译的文本")
search = require ("./../lib/search.coffee")
func_column = __F 'column'
func_article = __F 'article'
queuedo = require 'queuedo'
func_article.getAll 1,900,null,(error,articles)->
  queuedo articles,(article,next,context)->
    func_column.getById article.column_id,(error,column)->
      if column && column.name
        title = column.name+" "+ article.title
      else
        title = article.title
      en_func title,(en)->
        if en
          func_article.update article.id,
            pinyin:en
          .success ()->
            next.call(context)
          .error ()->
            next.call(context)
  ,()->
    