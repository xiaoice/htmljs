func_column = __F 'column'

module.exports = (req,res,next)->
  func_column.getAll 1,5,{is_jian:1},"id desc",(error,columns)->
    res.locals.jian_columns = columns
    next()