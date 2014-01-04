
Article = __M 'articles'
Column = __M 'columns'
User = __M "users"
Card = __M 'cards'
Visit_log = __M 'article_visit_logs'
en_func = require './../lib/translate.coffee'
Visit_log.sync()
User.hasOne Article,{foreignKey:"user_id"}
Article.belongsTo User,{foreignKey:"user_id"}
Article.sync()
Column.hasOne Article,{foreignKey:"column_id"}
Article.belongsTo Column,{foreignKey:"column_id"}

ArticleZanLogs = __M 'article_zan_logs'
User.hasOne ArticleZanLogs,{foreignKey:"user_id"}
ArticleZanLogs.belongsTo User,{foreignKey:"user_id"}
ArticleZanLogs.sync()
cache = 
  recent:[]
func_article =  
  getAll:(page,count,condition,order,callback)->
    if not callback
      callback = order
      order = "sort desc,id desc"
    query = 
      offset: (page - 1) * count
      limit: count
      order: order
      include:[User,Column]
      raw:true
    if condition then query.where = condition
    Article.findAll(query)
    .success (articles)->
      cache.recent = articles
      callback null,articles
    .error (error)->
      callback error
  getByUserIdAndType:(id,type,callback)->
    Article.findAll
      where:
        user_id:id
        type:type
        is_publish:1
      order: "id desc"
      limit:20
      raw:true
    .success (articles)->
      callback null,articles
    .error (error)->
      callback error
  getByUrl:(url,callback)->
    Article.find
      where:
        quote_url:url
      raw:true
    .success (article)->
      callback null,article
    .error (error)->
      callback error
  getByPinyin:(pinyin,callback)->
    Article.find
      where:
        pinyin:pinyin
      raw:true
    .success (article)->
      callback null,article
    .error (error)->
      callback error
  add:(data,callback)->
    data.uuid = uuid.v4()
    
    Article.create(data)
    .success (article)->
      
      article.updateAttributes {sort:article.id},['sort']
      Column.find
        where:
          id:article.column_id
      .success (column)->
        if column && column.name
          title = column.name+" "+ article.title
        else
          title = article.title
        en_func title,(en)->
          article.updateAttributes {pinyin:en},['pinyin']
      callback null,article
    .error (error)->
      callback error
  addComment:(articleId)->
    Article.find
      where:
        id:articleId
    .success (article)->
      if article
        article.updateAttributes
          comment_count: if article.comment_count then (article.comment_count+1) else 1
  addVisit:(articleId,visitor)->
    Article.find
      where:
        id:articleId
    .success (article)->
      if article
        article.updateAttributes {visit_count: if article.visit_count then (article.visit_count+1) else 1},['visit_count']
        if visitor
          Visit_log.create
            article_id:articleId
            user_id:visitor.id
            user_nick:visitor.nick
            user_headpic:visitor.head_pic
  getVisitors:(articleId,count,callback)->
  	if articleId
      condition = 
        article_id:articleId
    else
      condition = null
    Visit_log.findAll
      where:condition
      limit:count
      order:"id desc"
    .success (logs)->
      callback null,logs
    .error (error)->
      callback error
  addZan:(article_id,user_id,score,callback)->
    score = score*1
    ArticleZanLogs.find
      where:
        article_id:article_id
        user_id:user_id
    .success (log)->
      if log then callback new  Error '已经赞过这篇文章了哦'
      else
        Article.find
          where:
            id:article_id
        .success (article)->
          if not article then callback new  Error '不存在的文章'
          else
            ArticleZanLogs.create({
              article_id:article_id
              user_id:user_id
            }).success (log)->
              article.updateAttributes
                zan_count:article.zan_count*1+1
              callback null,log,article
            .error (e)->
              callback e
        .error (e)->
          callback e
    .error (e)->
      callback e
  getZanByArticleIdAndUserId:(article_id,user_id,callback)->
    ArticleZanLogs.find
      where:
        article_id:article_id
        user_id:user_id
    .success (log)->
      callback null,log
    .error (e)->
      callback e
  getRecent:(callback)->
    Article.findAll
      where:
        is_publish:1
      order: "id desc"
      limit:10
      raw:true
    .success (articles)->
      callback null,articles
    .error (error)->
      callback error
  getById:(id,callback)->
    Article.find
      where:
        id:id
      include:[User]
      raw:true
    .success (article)->
      callback null,article
    .error (error)->
      callback error
  getByPinyin:(pinyin,callback)->
    Article.find
      where:
        pinyin:pinyin
      include:[User]
      raw:true
    .success (article)->
      if not article 
        callback new Error '不存在的文章'
      else
        callback null,article
    .error (error)->
      callback error
  getZansByArticleId:(article_id,callback)->
    ArticleZanLogs.findAll
      where:
        article_id:article_id
      include:[User]
      order:"id desc"
      raw:true
    .success (logs)->
      callback null,logs
    .error (e)->
      callback e
__FC func_article,Article,['update','count','delete']
module.exports=func_article
