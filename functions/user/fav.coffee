Fav = __M 'user/favs'

FavHis = __M 'user/fav_history'
FavHis.sync()
User = __M 'users'

User.hasOne Fav,{foreignKey:"user_id"}
Fav.belongsTo User,{foreignKey:"user_id"}
Fav.sync()
func_fav = 
  getByUUID:(uuid,callback)->
    Fav.findAll
      where:
        info_id:uuid
      include:[User]
    .success (favs)->
      callback null,favs
    .error (e)->
      callback e
  add:(data,callback)->
  	Fav.find
  		where:
  			info_id:data.info_id
  			user_id:data.user_id
  	.success (fav)->
  		if fav
  			callback new Error '已经收藏过'
  		else
  			Fav.create(data)
  			.success (fav)->
  				callback null,fav
  			.error (e)->
  				callback e
  	.error (e)->
  		callback e
  getAll:(page,count,user_id,callback)->
    #select * from favs  left join articles  on articles.uuid = favs.info_id left join questions on questions.uuid = favs.info_id;
    sequelize.query("select fav.createdAt AS createdAt,fav.id AS id,
 article.id as article_id,
 article.user_id as article_user_id,
 article.user_nick as article_user_nick,
 article.user_headpic as article_user_headpic ,
 article.title as article_title,
 article.comment_count as article_comment_count,
 article.visit_count as article_visit_count,
 article.column_id as article_column_id,
 article.score as article_score,
 
 card.id as card_id,
 card.user_id as card_user_id,
 card.head_pic as card_head_pic,
 card.nick as card_nick,

 question.id as question_id,
 question.user_id as question_user_id,
 question.user_nick as question_user_nick,
 question.user_headpic as question_user_headpic ,
 question.title as question_title,
 question.answer_count as question_answer_count,
 question.visit_count as question_visit_count,

 topic.id as topic_id,
 topic.user_id as topic_user_id,
 topic.user_nick as topic_user_nick,
 topic.user_headpic as topic_user_headpic ,
 topic.title as topic_title,
 topic.comment_count as topic_comment_count,
 topic.visit_count as topic_visit_count,

 act.id as act_id,
 act.title as act_title,
 act.person_limit as act_person_limit,
 act.comment_count as act_comment_count,
 act.visit_count as act_visit_count

 from user_favs fav 
 left join articles  article on article.uuid = fav.info_id
 left join questions  question on question.uuid = fav.info_id 
 left join cards  card on card.uuid = fav.info_id 
 left join topics  topic on topic.uuid = fav.info_id 
 left join acts act on act.uuid = fav.info_id
 where fav.user_id = "+user_id+" 
 order by fav.createdAt desc limit "+(page-1)*count+","+count+";",null, {raw: true})
    .success (data)->
      callback null,data
    .error (e)->
      callback e
__FC func_fav,Fav,['count']
module.exports = func_fav