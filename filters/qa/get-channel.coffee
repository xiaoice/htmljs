func_channel = __F 'qa/channel'

module.exports = (req,res,next)->
  if res.locals.question.channel_id
    func_channel.getById res.locals.question.channel_id,(error,channel)->
      res.locals.channel = channel
      next()
  else
    next()
