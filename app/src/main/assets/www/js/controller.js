var service = null;

var loginCommand = {
	nickname: null,
	avatar: null,
	roomId: null,
	roomName: null
};

//选择头像
function chooseAvatar(avatarInstance) {
	//清除其他头像的选择
	var avatarNode = $(avatarInstance);
	avatarNode.siblings().removeClass("extra-margin");

	//修改选中头像的样式
	avatarNode.addClass("extra-margin");

	//头像赋值
	loginCommand.avatar = avatarNode.children("img").attr("src");
	//隐藏错误信息
	$(".error-notice").hide();
}


//登录聊天室
function login(id) {
	//昵称赋值
	loginCommand.nickname = $("#userName").val();

	// 聊天室id，聊天室名称赋值
	loginCommand.roomId = id;
	loginCommand.roomName = $(event.target).text();

	//通过验证进入聊天室
	if (validateUser()) {
		//通过验证后，进入聊天室
		joinRoom();
	}
}

//昵称不能为空，必须选择头像
function validateUser() {
	var avatar = loginCommand.avatar;
	var nickName = loginCommand.nickname;
	
	if (nickName.trim().length != 0 && avatar) {
		return true;
	}

	if (nickName.trim().length == 0) {
		$(".input-notice").attr("placeholder", "昵称不能为空");
		$(".input-notice-box").addClass("input-notice-box-border");
	}
	if (avatar == "" || avatar == undefined) {
		$(".error-notice").show();
	}
	return false;
}

//滚动到最底部
function scrollBottom() {
	$('.chatRoom-content-box').scrollTop($('.chatRoom-content-box')[0].scrollHeight);
}

//进入聊天室
function joinRoom() {
	// 当前用户
	var currentUser = {
		id: (Math.random() * 1000).toString(),
		nickname: loginCommand.nickname,
		avatar: loginCommand.avatar
	}
	// 当前房间
	var room = {
		id: loginCommand.roomId,
		name: loginCommand.roomName
	}
	service = new ChatRoomService(room, currentUser);

	// 初始化聊天室
	service.initialWhenNewMessage(this.whenNewMessage);
	service.initialWhenOnlineUserChange(this.whenOnlineUserChange);
	service.connectGoEasyIM();
	showChatRoom();
}

function whenNewMessage(message) {
	// 首先判断是否是普通消息或者动画消息
	if (message.type == service.room.MessageType.PROP) {
		// 判断是火箭还是爱心
		if(message.content == service.room.Prop.HEART){
			onNewHeart(message.senderNickname);
		}
		else {
			onNewRocket(message.senderNickname);
		}
	}
	else {
		if(message.senderUserId == service.room.currentUser.id){
			onNewMessage(message.senderNickname,message.content, true);
		}else {
			onNewMessage(message.senderNickname,message.content, false);
		}
	}
	scrollBottom();
}

function whenOnlineUserChange(onLineUser) {
	onJoinAndLeaveRoom();
}


//页面切换到聊天室界面
function showChatRoom() {
	$(".chatRoom-content-box").empty();
	//更新房间名
	$("#chatRoom-header").find(".current-chatRoom-name").text(loginCommand.roomName);

	//加载聊天历史
	service.room.messages.forEach(function(message) {
		//展示发送的消息
		var otherPerson = createCurrentChatRoomPerson(message.senderNickname + ":", message.content)
		$(".chatRoom-content-box").append($(otherPerson));
	})
	//隐藏登录界面
	$(".chat-login-box").hide();
	// //显示聊天界面
	$(".chatRoom-box").show();
	// //滑动到最后一行
	scrollBottom();
}

//更新在线用户里诶包和用户数
function updateOnlineUsers() {
	//清空头像
	$(".chatRoom-box .current-online-num-box .current-online-icon").remove();

	//展示在线人数
	var onLineCount = service.room.onlineUsers.count;
	$(".current-num").text(onLineCount);

	var users = service.room.onlineUsers.users;

	var initRight = 70;
	var initZindex = 1000;
	var currentOnlineNum = $(".current-online-num-box");
	// 将新到的用户展现到最前面
	for (var i = users.length - 1; i >= 0; i--) {
		var item = users[i];
		var onLineIcon = $(createCurrentOnlineIcon())
		onLineIcon.find("img").attr("src", item.avatar);
		onLineIcon.css({
			"right": initRight + "px",
			"z-index": initZindex
		})
		initRight += 30;
		initZindex -= 1;
		currentOnlineNum.append(onLineIcon);
	}
}

function onJoinAndLeaveRoom(user) {
	//页面展示 XXXX进来了
	var leaveAndJoinUser = service.room.messages[service.room.messages.length - 1];
	$(".chatRoom-content-box").append(createOnlineBox(leaveAndJoinUser.senderNickname, leaveAndJoinUser.content))

	//刷新当前聊天室的在线人数
	updateOnlineUsers();
	scrollBottom();
}

//发言
function sendMessages(messageType, content) {
	// 判断是普通消息还是动画消息
	if (messageType == service.room.MessageType.CHAT) {
		content = $("#message").val();
	}
	var chatRoomContent = $(".chatRoom-content-box");

	var message = {
		senderNickname: service.room.currentUser.nickname,
		senderUserId: service.room.currentUser.id,
		type: messageType,
		content: content
	}
	if (content.length != 0) {
		service.sendMessages(service.room.id, message);
		// 清空消息
		$("#message").val("");
	}
}

//展示收到消息
function onNewMessage(nickName, content, selfSent) {
	//页面展示 XXXX:XXXXX
	//展示发送的消息
	var otherPerson = $(createCurrentChatRoomPerson(nickName + ': ', content))

	//给自己发送的消息添加颜色
	if (selfSent) {
		otherPerson.find(".current-person-message").addClass("self-person-color");
	}
	$(".chatRoom-content-box").append(otherPerson);
	// 滚动到底部
	scrollBottom();
}

//收到桃心
function onNewHeart(nickName) {
	//页面展示 XXXX:XXXXX
	// 比心展示
	$(".heart-icon").show();
	new TweenMax('.heart', 2, {
		top: 0,
		ease: Power0.easeNone,
		onComplete: function() {
			$(".heart").css("top", 250);
			$(".heart-icon").css("display", "none");
		}
	});

	$(".chatRoom-content-box").append(createCurrentChatRoomPerson(nickName + " ", "送出了一个大大的比心"));

	// 滚动到底部
	scrollBottom();
}

//收到火箭
function onNewRocket(nickName) {
	//页面展示 XXXX:XXXXX
	// 火箭展示
	$(".rocket").show();
	$(".rocket-icon").show();
	new TweenMax('.rocket', 2, {
		top: 0,
		ease: Power0.easeNone,
		onComplete: function() {
			$(".rocket").css("top", 510);
			$(".rocket-icon").css("display", "none");
			$(".rocket").hide();
		}
	});

	$(".chatRoom-content-box").append(createCurrentChatRoomPerson(nickName + " ", "送出了一枚大火箭"));
	// 滚动到底部
	scrollBottom();
}

function leaveRoom() {
	service.quitRoom();
	// 点击退出时，将firstLoadHistory赋值为true
	firstLoadHistory = true;
	
	$(".chat-login-box").show();
	$(".chatRoom-box").hide();
}


/**
 * 构建其他人发消息模板
 * @param name
 * @param message
 * @returns {string}
 */
function createCurrentChatRoomPerson(name, message) {
	return (
		'<div class="current-chatRoom-person">' +
		'<div class="current-person-words">' +
		'<sapn class="current-person-name">' + name + '</span>' +
		'<span class="current-person-message">' + message + '</sapn>' +
		'</div>' +
		'</div>'
	)
}

/**
 * 构建上下线 离线断网模板
 * @param name
 * @param notice
 * @returns {string}
 */
function createOnlineBox(name, notice) {
	return (
		'<div class="online-box">' +
		'<div class="online-message">' +
		'<sapn class="user-name">' + name + '</span>' +
		'<span class="user-notice">' + notice + '</sapn>' +
		'</div>' +
		'</div>'
	)
}

/**
 * 构建在线用户
 * @returns {string}
 */
function createCurrentOnlineIcon() {
	return (
		'<div class="current-online-icon">' +
		'<img class="current-icon" src="#">' +
		'</div>'

	)
}
