func_channel = __F 'qa/channel'
func_question = __F 'question'

module.exports = (req,res,next)->
  if not req.query.channel_id
    func_channel.getAll 1,30,{hide:0},"sort ,id desc",(error,channels)->
      res.locals.channels = channels
      next()
  else
    func_channel.getById req.query.channel_id,(error,channel)->
      res.locals.channel = channel
      next()