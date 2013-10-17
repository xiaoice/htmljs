Segment = require('segment').Segment;
segment = new Segment();
segment.useDefault();
filter_keywords = require './../lib/filter_keyword.js'
Keyword = __M 'keywords'
fenci = (string)->
  items = segment.doSegment string
  result = []
  items.forEach (item)->
    if filter_keywords.indexOf item.w == -1
      result.push item.w
module.exports = 
  fenxiArticle:(article,callback)->
    Keyword.find
      where:
        uuid:article.uuid
    .success (k)->
      if k 
        callback new Error '已经添加过此文章的索引'
