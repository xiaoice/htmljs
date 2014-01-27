require './../lib/modelLoader.coffee'
require './../lib/functionLoader.coffee'
s = "abcdefghijklmnopqrstuvwxyz0123456789"
func_url = __F 'url'
neighbours =
  1: s.split ""
getPINs = (observed, prefix)->
  prefix = prefix or ""
  if observed.length is 0
    prefix
  else
    neighbours[observed[0]].reduce ((acc, d)->
      acc.concat getPINs(observed.substring(1), prefix + d)
    ), []
arr = getPINs "111"
arr.forEach ((p)->
  console.log p
)