func_column = __F 'column'
module.exports = (req,res,next)->
  if res.locals.user && res.locals.columns
    func_column.getRssesByUserId res.locals.user.id,(error,rsses)->
      if rsses && rsses.length
        rssed_column_ids = []
        rsses.forEach (rss)->
          rssed_column_ids.push rss.column_id
        res.locals.columns.forEach (column)->
          if rssed_column_ids.indexOf(column.id) != -1
            column.is_rssed = true
        next()
      else
        next()

  else
    next()
