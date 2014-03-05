Articles = __M 'blog/articles'
Articles.sync()
Blog = __M 'blog/blogs'
Blog.hasOne Articles,{foreignKey:"blog_id"}
Articles.belongsTo Blog,{foreignKey:"blog_id"}
uuid = require 'node-uuid'
func_article = 
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
      include:[Blog]
    if condition then query.where = condition
    if include then query.include = include
    Articles.findAll(query)
    .success (ms)->
      callback null,ms
    .error (e)->
      callback e
  getByUrl:(url,callback)->
    Articles.find
      where:
        url:url
    .success (article)->
      if article
        callback null,article
      else
        callback new Error '不存在的博文'
    .error (e)->
      callback e
  add:(data,callback)->
    Articles.find
      where:
        url:data.url
    .success (article)->
      if article
        callback new Error '已经存在的文章'
      else
        data.uuid = uuid.v4()
        Articles.create(data)
        .success (m)->
          callback&&callback null,m
        .error (error)->
          callback&&callback error
    .error (e)->
      callback e
__FC func_article,Articles,['add','getById','update','count','addCount','delete']

module.exports = func_article