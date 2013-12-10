require './../lib/modelLoader.coffee'
require './../lib/functionLoader.coffee'
en_func = require './../lib/translate.coffee'
func_column = __F 'column'
func_article = __F 'article'
queuedo = require 'queuedo'
func_article.getAll 1,1000,null,(error,articles)->
  queuedo articles,(article,next,context)->
    if article.pinyin
      func_article.update article.id,{pinyin:article.pinyin.replace( /\s+?/g,"-")},()->
        next.call(context)
    else
      next.call(context)
  ,()->
(__F 'question').getAll 1,1000,null,(error,qas)->
  queuedo qas,(qa,next,context)->
    if qa.pinyin
      (__F 'question').update qa.id,{pinyin:qa.pinyin.replace( /\s+?/g,"-")},()->
        next.call(context)
    else
      next.call(context)
  ,()->
# (__F 'question').getAll 1,50,null,(error,articles)->
#   queuedo articles,(qa,next,context)->
#     en_func qa.title,(en)->
#       if en
#         (__F 'question').update qa.id,
#           pinyin:en
#         .success ()->
#           next.call(context)
#         .error ()->
#           next.call(context)
#   ,()->
#     