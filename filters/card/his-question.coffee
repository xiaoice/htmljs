module.exports = (req,res,next)->
  if not res.locals.card then next()
  else
    user_id = res.locals.card.user_id
    (__F 'question').count {user_id:user_id},(error,count)->
      res.locals.his_questions_count = count
      (__F 'question').getAll 1,10,{user_id:user_id},null,(error,questions)->
        res.locals.his_questions = questions
        next()