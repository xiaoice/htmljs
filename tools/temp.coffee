require './../lib/modelLoader.coffee'
require './../lib/functionLoader.coffee'

func_card = __F 'card'
func_user = __F 'user'

func_card.getAll 1,1000,null,(error,cards)->
  cards.forEach (card)->
    if card.user_id
      func_user.update card.user_id,{desc:card.desc,sex:card.sex},()->
        console.log card.nick