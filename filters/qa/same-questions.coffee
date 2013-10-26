func_question = __F 'question'
func_tag = __F 'tag'
module.exports = (req,res,next)->
  condition = []
  querystring = ''
  res.locals.question.tagNames.split(',').forEach (tagname,i)->
    if i!=0
      querystring+=" or "
    querystring+=" questions.tagNames like ? "
    condition.push "%"+tagname+"%"
  condition.unshift querystring
  func_question.getAll 1,10,condition,(error,questions)->
    res.locals.same_questions = questions
    next()