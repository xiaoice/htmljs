func_question = __F 'question'
module.exports = (req,res,next)->
  func_question.getById req.params.id,(error,question)->
    if error then next error
    else if not question then next new Error '不存在的问题'
    else
      res.locals.question = question
      next()