func_blog = __F 'blog/blog'

module.exports = (req,res,next)->
  func_blog.getAll 1,100,null,"createdAt desc",(error,blogs)->
    res.locals.blogs = blogs
    next()
