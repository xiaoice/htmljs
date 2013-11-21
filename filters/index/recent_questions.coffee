func_question = __F 'question'
module.exports = (req,res,next)->
  if req.query.page 
    next()
    return
  func_question.getAll 1,10,null,"sort desc,id desc",(error,questions)->
    res.locals.questions = questions
    next()