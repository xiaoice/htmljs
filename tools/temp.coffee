require './../lib/modelLoader.coffee'
require './../lib/functionLoader.coffee'

func_column = __F 'column'
func_article = __F 'article'

func_column.getAll 1,1000,null,(error,columns)->
  columns.forEach (column)->
    func_article.getAll 1,1000,{column_id:column.id},(error,articles)->
      if error then console.log error
      else
        func_column.update column.id,{article_count:articles.length},()->
