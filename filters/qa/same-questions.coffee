func_question = __F 'question'
func_tag = __F 'tag'
module.exports = (req,res,next)->
  condition = []
  querystring = ''
  # redis_client.get __filename+res.locals.question.tagNames,(error,data)->
  #   if data
  #     try
  #       questions = JSON.parse data
  #       res.locals.same_questions = questions
  #       next()
  #       return;
  #     catch e 
  #       console.log 'redis parse error'
  res.locals.question.tagNames.split(',').forEach (tagname,i)->
    if i!=0
      querystring+=" or "
    querystring+=" questions.tagNames like ? "
    condition.push "%"+tagname+"%"
  condition.unshift querystring
  func_question.getAll 1,10,condition,(error,questions)->
    res.locals.same_questions = questions
    # redis_client.set __filename+res.locals.question.tagNames,(JSON.stringify questions)
    # redis_client.expire __filename+res.locals.question.tagNames,60*10
    next()