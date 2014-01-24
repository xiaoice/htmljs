func_channel = __F 'qa/channel'
func_question = __F 'question'
func_channel_users = __F 'qa/channel_users'
temp_channels = []
module.exports = (req,res,next)->
  if not req.query.channel_id
    if temp_channels.length
      res.locals.channels = temp_channels
      next()
    else
      func_channel.getAll 1,100,{hide:0},"sort ,id desc",(error,channels)->
        count = channels.length
        channels.forEach (c)->
          func_channel_users.getAll 1,100,{channel_id:c.id},(error,users)->
            c.users = users
            count--
            if count==0
              res.locals.channels = temp_channels = channels
              next()
  else
    func_channel.getById req.query.channel_id,(error,channel)->
      res.locals.channel = channel
      func_channel_users.getAll 1,100,{channel_id:req.query.channel_id},(error,users)->
        channel.users = users
        next()