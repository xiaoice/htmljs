Articles = __M 'blog/articles'
Articles.sync()

func_article = {}

__FC func_article,Articles,['add','getById','getAll','update','count','addCount','delete']

module.exports = func_article