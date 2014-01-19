module.exports = 
  id:
    type:"int"
    autoIncrement: true
    primaryKey: true
  uuid:"varchar(40)"
  user_id:"int"
  answer_count:  #回答过多少个问题
    type:"int"
    defaultValue:0
  b_zan_count:  #被赞的次数
    type:"int"
    defaultValue:0
  question_count:  #提问的次数
    type:"int"
    defaultValue:0
  article_count: #发表文章的次数
    type:"int"
    defaultValue:0
  b_comment_count: #被评论的次数
    type:"int"
    defaultValue:0
  b_score_count: #被打分的次数
    type:"int"
    defaultValue:0
  score_count: #打分的次数
    type:"int"
    defaultValue:0
  b_invite_count: #被邀请的次数
    type:"int"
    defaultValue:0
  column_count: #创建专栏的次数
    type:"int"
    defaultValue:0
  b_visit_count: #被访问次数
    type:"int"
    defaultValue:0
  