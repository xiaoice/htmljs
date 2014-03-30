func_card = __F 'card'
func_user = __F 'user'

module.exports = (req,res,next)->
    func_user.getById res.locals.article.user_id,(error,user)->
        res.locals.writer = user
        next()