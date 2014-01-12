    $("#status").html("正在连接聊天服务器中。。。")
    var uuid = null;
    var talk_tpl = $("#talk-tpl").html()
    var user_tpl = $("#user-tpl").html()
    var socket = io.connect('http://talk.html-js.com',{port:8765});
    socket.on('connected', function (data) {
      console.log("connected");
      socket.emit('get-uuid',{id:"dd"});
    });
    socket.on("new-message",function(data){
      var m = $(Mustache.render(talk_tpl,data.talk));
      $("#message-list").prepend(m)
      $(".message").removeClass("shan")
      m.addClass("shan")
      renderUser(data.onlines)
    })
    socket.on("alert",function(data){
      alert(data.sender+" 刚刚at了你")
    })
    socket.socket.on("error",function(data){
      console.log("error:"+data)
      $("#status").html("连接失败，是否已经登录？")
    })
    socket.socket.on("connect",function(data){
      $("#status").html("连接成功")
    })
    $("#submit").on("click",function(){
      socket.emit('new-message', { content:$("#send-md").val()});
      $("#send-md").val("")
    })


    var renderUser = function(onlines){
      console.log(onlines)
      if (!onlines) return;
      $("#user-list").html("")
      var html = "";
      for(var i in onlines){
        if(onlines[i]){
           html+= Mustache.render(user_tpl,onlines[i]);
        }
      }
      $("#user-list").html(html)
     
    }
    $("#user-list").on("click",function(e){
      e.preventDefault();
      if($(e.target).closest(".user").length){
         $("#send-md").val("@"+$(e.target).closest(".user").attr("data-nick")+" ").focus()
      $("#send-md")[0].setSelectionRange($("#send-md")[0].value.length, $("#send-md")[0].value.length)
      }
     
      
    })