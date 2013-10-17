Column = __M 'columns'
User = __M "users"
Card = __M 'cards'
Article = __M 'articles'
User.hasOne Column,{foreignKey:"user_id"}
Column.belongsTo User,{foreignKey:"user_id"}
Column.hasMany Article,{foreignKey:"column_id",as:"articles"}
Column.sync()
ColumnRss = __M 'column_rsses'
Card.hasOne ColumnRss,{foreignKey:"user_id"}
ColumnRss.belongsTo Card,{foreignKey:"user_id"}
ColumnRss.sync()


func_column = 
  getAll:(page,count,condition,desc,user_id,callback)->
    query = 
      offset: (page - 1) * count
      limit: count
      order: if desc then desc else "article_count desc"
      include:[User]
    if condition then query.where = condition
    Column.findAll(query)
    .success (columns)->
      ids = []
      columns.forEach (column)->
        ids.push column.id
      Article.findAll 
        where:
          column_id:ids
        order:"id desc"
      .success (articles)->
        columns.forEach (column)->
          column.articles = []
          articles.forEach (article)->
            if column.id == article.column_id
              column.articles.push article
        if user_id
          ColumnRss.findAll
            where:
              column_id:ids
              user_id:user_id
          .success (rss_logs)->
            rss_logs.forEach (log)->
              columns.forEach (col)->
                if col.id == log.column_id
                  col.is_rssed = true
            callback null,columns
          .error (e)->
            callback e
        else
          callback null,columns
      .error (e)->
        callback e
    .error (error)->
      callback error
  getById:(id,callback)->
    Column.find
      where:
        id:id
      include:[User]
    .success (column)->
      callback null,column
    .error (e)->
      callback e
  addRss:(column_id,user_id,callback)->
    ColumnRss.find
      where:
        column_id:column_id
        user_id:user_id
    .success (rss)->
      if rss
        callback new Error '已经订阅过此专栏'
      else
        func_column.addCount column_id,"rss_count",()->

        ColumnRss.create({user_id:user_id,column_id:column_id,uuid:uuid.v4()})
        .success (rss)->
          callback null,rss
        .error (e)->
          callback e
    .error (e)->
      callback e
  getRsses:(column_id,callback)->
    ColumnRss.findAll
      where:
        column_id:column_id
      include:[Card]
    .success (rsses)->
      callback null,rsses
    .error (e)->
      callback e
  getUsersRss:(column_id,user_id,callback)->
    ColumnRss.find
      where:
        column_id:column_id
        user_id:user_id
    .success (rss)->
      if rss
        callback null,rss
      else
        callback new Error '没有订阅过此专栏'
    .error (e)->
      callback e
__FC func_column,Column,['delete','add','addCount','count']
module.exports = func_column