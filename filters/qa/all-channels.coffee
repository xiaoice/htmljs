func_channel = __F 'qa/channel'
func_question = __F 'question'

module.exports = (req,res,next)->
  func_channel.getAll 1,30,{hide:0},"sort ,id desc",(error,channels)->
    res.locals.channels = channels
    next()
