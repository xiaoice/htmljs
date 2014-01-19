search = require ("./../lib/search.coffee")

search.query {"query":"前端","limit":3,"offset":1},(error,data)->
  console.log JSON.parse data