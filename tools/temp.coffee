require './../lib/modelLoader.coffee'
require './../lib/functionLoader.coffee'
en_func = require './../lib/translate.coffee'
func_column = __F 'column'
func_article = __F 'article'
queuedo = require 'queuedo'
# func_article.getAll 1,50,null,(error,articles)->
#   queuedo articles,(article,next,context)->
#     func_column.getById article.column_id,(error,column)->
#       if column && column.name
#         title = column.name+" "+ article.title
#       else
#         title = article.title
#       en_func title,(en)->
#         if en
#           func_article.update article.id,
#             pinyin:en
#           .success ()->
#             next.call(context)
#           .error ()->
#             next.call(context)
#   ,()->

(__F 'question').getAll 1,50,null,(error,articles)->
  queuedo articles,(qa,next,context)->
    en_func qa.title,(en)->
      if en
        (__F 'question').update qa.id,
          pinyin:en
        .success ()->
          next.call(context)
        .error ()->
          next.call(context)
  ,()->
    