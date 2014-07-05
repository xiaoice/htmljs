
func_column = __F 'column'

module.exports = (req,res,next)->

  func_column.getColumnUsers res.locals.column.id,(error,users)->
    res.locals.column_users = users
    res.locals.column_canedit = false
    if users
      users.forEach (u)->
        if u.id==res.locals.user.id
          res.locals.column_canedit = true
      
    next()