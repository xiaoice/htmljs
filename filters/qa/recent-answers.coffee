module.exports = (req,res,next)->
  # redis_client.get __filename,(error,data)->
  #   if data
  #     try
  #       answers = JSON.parse data
  #       res.locals.recent_answers = answers
  #       next()
  #       return;
  #     catch e 
  #       console.log 'redis parse error'
    (__F 'answer').getAllWithQuestion 1,10,null,"id desc",(error,answers)->
      res.locals.recent_answers = answers
      # redis_client.set __filename,(JSON.stringify answers)
      # redis_client.expire __filename,60*10
      next()