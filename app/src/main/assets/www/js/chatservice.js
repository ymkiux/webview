/*
 * @Author: jack.lu
 * @Date: 2020-4-21 10:10:20
 * @Last Modified by: jack.lu
 * @Last Modified time: 2020-4-21 15:01:41
 */


//用户
function User(id, nickname, avatar) {
	this.id = id;
	this.nickname = nickname;
	this.avatar = avatar;
}

//消息
function Message(senderUserId, senderNickname, content, type) {
	this.senderNickname = senderNickname;
	this.senderUserId = senderUserId;
	this.content = content;
	this.type = type
}

//聊天室
function Room(id, name, currentUser) {

	this.id = id;
	this.name = name;
	this.currentUser = currentUser;

	this.onlineUsers = {
		count: 0,
		users: []
	};

	this.messages = [];

	this.MessageType = {
		CHAT: 0, //文字聊天
		PROP: 1 //道具
	};

	this.Prop = {
		HEART: 0, //桃心
		ROCKET: 1 //火箭
	};
}

function ChatRoomService(room, user) {
	this.room = new Room(room.id, room.name, user);
	this.whenNewMessage = function() {

	};
	this.whenOnlineUserChange = function() {
		
	};

}

//获取实例
ChatRoomService.prototype.connectGoEasyIM = function() {
	this.im = GoEasyIM.getInstance({
		appkey: "您的common key",
		host: 'hangzhou.goeasy.io'
	});

	//监听网络连接成功
	this.im.on(GoEasyIM.EVENT.CONNECTED, () => {
		console.log('GoEasyIM网络连接成功');
		//连接成功后，更新在线用户数和用户头像
		this.initialOnlineUsers(this.room.id);
	});

	//监听网络连接断开
	this.im.on(GoEasyIM.EVENT.DISCONNECTED, () => {
		console.log('GoEasyIM网络断开')
	});

	//监听上下线提醒
	this.listenerGroupPresence();

	//监听新消息
	this.listenerNewMessage();

	var currentUser = this.room.currentUser;
	//连接GoEasyIM
	this.im.connect({
		id: currentUser.id,
		data: {
			avatar: currentUser.avatar,
			nickname: currentUser.nickname
		}
	}).then(() => {
		console.log('连接成功');
		this.initialChatHistory(this.room.id);

		//订阅用户上下线事件
		this.subscribePresence(this.room.id);
		//订阅聊天室消息
		this.subscribeRoomMessage(this.room.id);


	}).catch(e => {
		console.log(e);
		console.log('连接失败');
	});
};

ChatRoomService.prototype.initialWhenNewMessage = function(whenNewMessage) {
	this.whenNewMessage = whenNewMessage;
};

ChatRoomService.prototype.initialWhenOnlineUserChange = function(whenOnlineUserChange) {
	this.whenOnlineUserChange = whenOnlineUserChange;
};


//监听新消息
ChatRoomService.prototype.listenerNewMessage = function() {

	this.im.on(GoEasyIM.EVENT.GROUP_MESSAGE_RECEIVED, (message) => {
		this.addNewMessage(message);
		this.whenNewMessage(JSON.parse(message.payload.text))
	})
}

ChatRoomService.prototype.addNewMessage = function(message) {
	var content = JSON.parse(message.payload.text);
	let messageContent = "";
	//聊天消息
	if (content.type == this.room.MessageType.CHAT) {
		messageContent = content.content;
	}
	//道具消息
	if (content.type == this.room.MessageType.PROP) {
		if (content.content == this.room.Prop.ROCKET) {
			messageContent = "送出了一枚大火箭";
		}
		if (content.content == this.room.Prop.HEART) {
			messageContent = "送出了一个大大的比心";
		}
	}
	//添加消息
	let newMessage = new Message(message.senderId, content.senderNickname, messageContent);
	this.room.messages.push(newMessage);
};

//监听用户上下线
ChatRoomService.prototype.listenerGroupPresence = function() {
	this.im.on(GoEasyIM.EVENT.GROUP_PRESENCE, (event) => {
		//更新在线用户数
		this.room.onlineUsers.count = event.groupOnlineCount;

		if (event.action == 'join' || event.action == 'online') {
			let userData = JSON.parse(event.userData);
			//添加新用户
			let user = new User(event.userId, userData.nickname, userData.avatar);
			
			//添加在线用户，避免用户重复
			if (!this.room.onlineUsers.users.find(item => item.id == event.userId)) {
				this.room.onlineUsers.users.push(user);
			}

			//添加进入房间的消息
			let message = new Message(event.userId, userData.nickname, " 进入房间", this.room.MessageType.CHAT);
			this.room.messages.push(message);
		} else {
			let offlineUserIndex = this.room.onlineUsers.users.findIndex(item => item.id == event.userId);
			if (offlineUserIndex > -1) {
				//将离开的用户从onlineUsers中删掉
				let offlineUser = Object.assign(this.room.onlineUsers.users[offlineUserIndex]);
				this.room.onlineUsers.users.splice(offlineUserIndex, 1);
				//添加离开消息
				let message = new Message(offlineUser.id, offlineUser.nickname, " 离开房间", this.room.MessageType.CHAT)
				this.room.messages.push(message);
			}
		}
		this.whenOnlineUserChange(this.room.onlineUsers);
	})
};

//查询和初始化在线用户列表和在线用户数
ChatRoomService.prototype.initialOnlineUsers = function(roomId) {
	let self = this;

	//查询最新上线的用户列表
	this.im.groupHereNow(roomId)
		.then(result => {
			if (result.code == 200) {
				let users = [];
				result.content && result.content.map(function(onlineUser) {
					let userData = JSON.parse(onlineUser.userData);
					let user = new User(onlineUser.userId, userData.nickname, userData.avatar);
					users.push(user);
				});
				self.room.onlineUsers = {
					users: users
				};
			}
		}).catch(e => {
			if (e.code == 401) {
				console.log("您还没有开通用户在线状态提醒，登录goeasy->我的应用->查看详情->高级功能，自助开通.");
			} else {
				console.log(e);
			}
		});
	//获取聊天室在线用户数
	this.im.groupOnlineCount(roomId)
		.then(result => {
			this.room.onlineUsers.count = result.content.onlineCount;
		}).catch(e => {
			console.log(e)
		})
};

//订阅聊天室成员上下线
ChatRoomService.prototype.subscribePresence = function(roomId) {
	this.im.subscribeGroupPresence([roomId])
		.then(() => {
			console.log('成员上下线订阅成功')
		}).catch(e => {
			console.log(e)
		})
}

//订阅聊天室消息
ChatRoomService.prototype.subscribeRoomMessage = function(roomId) {
	this.im.subscribeGroup([roomId])
		.then(result => {
			console.log('消息订阅成功')
		}).catch(e => {
			console.log(e)
		})
}

//历史消息
ChatRoomService.prototype.initialChatHistory = function(roomId) {
	var self = this;
	this.im.history({
		groupId: roomId
	}).then(res => {
		res.content.forEach(function(message) {
			self.addNewMessage(message);
			self.whenNewMessage(JSON.parse(message.payload.text));
		})
	}).catch(function(error) {
		if (error.code == 401) {
			console.log("您还没有开通历史消息的权限，登录goeasy->我的应用->查看详情->高级功能，自助开通.");
		} else {
			console.log(error);
		}
	})
};

//发送消息
ChatRoomService.prototype.sendMessages = function(roomId, content) {
	var contentMessage = {
		text: JSON.stringify(content)
	};
	let message = this.im.createTextMessage(contentMessage);
	this.im.sendGroupMessage(roomId, message)
		.then(() => {
			console.log('消息发送成功')
		}).catch(e => {
			console.log(e);
		})
};

//退出聊天室
ChatRoomService.prototype.quitRoom = function(roomId) {
	this.im.disconnect()
};
