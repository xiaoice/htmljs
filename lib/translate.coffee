request = require 'request'
pinyin = require ("./../lib/PinYin.js")
en_func = (text,callback)->
  request.get "http://openapi.baidu.com/public/2.0/bmt/translate?client_id=HtiSPl1lCtzy0IBuWhuh2VHw&from=zh&to=en&q="+text,(e,r,body)->
    console.log body
    en = null
    try
      result = JSON.parse body
      en = result.trans_result[0].dst
    catch e
      en = pinyin(text,{heteronym: false,style: pinyin.STYLE_NORMAL}).join("")
    callback en.replace(/[^a-zA-Z0-9 ]/g,"")

module.exports = en_func