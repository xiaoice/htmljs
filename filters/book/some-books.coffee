ArrayUtil = require './../../lib/array-util.coffee'
module.exports = (req,res,next)->
  (__F 'book').getAll 1,50,{},(error,books)->
    if error then next error
    else
      res.locals.r_books = ArrayUtil.randomItem(books,10)
      next()