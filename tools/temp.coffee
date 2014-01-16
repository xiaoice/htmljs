require './../lib/modelLoader.coffee'
require './../lib/functionLoader.coffee'
en_func = require './../lib/translate.coffee'
func_question = __F 'question'
func_channel = __F 'qa/channel'
queuedo = require 'queuedo'
func_channel.getAll 1,1000,null,(error,cs)->
  queuedo cs,(channel,next,context)->
      func_question.getAll 1,10000,{channel_id:channel.id},(error,qs)->
        v = 0
        qs.forEach (q)->
          v+=q.visit_count*1
        func_channel.update channel.id,{qa_count:qs.length,visit_count:v}
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