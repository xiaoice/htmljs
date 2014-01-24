func_channel_users = __F 'qa/channel_users'
module.exports = (req,res,next)->
  if req.query.channel_id
    func_channel_users.getByChannelId req.query.channel_id,1,(error,pros)->
      res.locals.pros = pros
      next()
  else
    next()