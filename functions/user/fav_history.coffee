FavHis = __M 'user/fav_history'
FavHis.sync()

func_fav_his = {}

__FC func_fav_his,FavHis,['getAll','add']

module.exports = func_fav_his