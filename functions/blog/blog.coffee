Blog = __M 'blog/blogs'
Blog.sync()
User = __M 'users'
User.hasOne Blog,{foreignKey:"user_id"}
Blog.belongsTo User,{foreignKey:"user_id"}
func_blog = 
  getAll:(page,count,condition,order,include,callback)->
    if arguments.length == 4
      callback = order
      order = null
      include = null
    else if arguments.length == 5
      callback = include
      include = null
    query = 
      offset: (page - 1) * count
      limit: count
      order: order || "id desc"
      raw:true
      include:[User]
    if condition then query.where = condition
    if include then query.include = include
    Blog.findAll(query)
    .success (ms)->
      callback null,ms
    .error (e)->
      callback e
  getByName:(name,callback)->
    Blog.find
      where:
        name:name
    .success (b)->
      if b then callback null,b
      else
        callback new Error '不存在'
    .error (e)->
      callback e
      
__FC func_blog,Blog,['add','getById','update','count','addCount','delete']

module.exports = func_blog