module.exports = (req,res,next)->
  # redis_client.get __filename,(error,data)->
  #   if data
  #     try
  #       questions = JSON.parse data
  #       res.locals.hot_questions = questions
  #       next()
  #       return;
  #     catch e 
  #       console.log 'redis parse error'
    (__F 'question').getAll 1,10,null,'visit_count+answer_count desc',(error,questions)->
      res.locals.hot_questions = questions
      # redis_client.set __filename,(JSON.stringify questions)
      # redis_client.expire __filename,60*10
      next() 