var db = require('./db-client');
var utils = require('./utils');

"use strict";
 
process.title = 'daily-chat';
 
var webSocketsServerPort = 1337;
 
var webSocketServer = require('websocket').server;
var http = require('http');
 

var history = [];
var clients = [];
var active_users = utils.readUsersFromFile()
var remote_to_username = {}
 
function htmlEntities(str) {
return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;')
.replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

var server = http.createServer(function(request, response) {});
server.listen(webSocketsServerPort, function() {
	console.log((new Date()) + " Server is listening on port " + webSocketsServerPort);
	db.connect()
	setInterval(function(){
		sendActiveUsers();
	}, 10000);
});

var wsServer = new webSocketServer({
httpServer: server
});


wsServer.on('request', function(request) {
	console.log((new Date()) + ' Connection from origin ' + request.origin + '.');
	var connection = request.accept(null, request.origin);
	var index = clients.push(connection) - 1;
	console.log("clients length" + clients.length)
	var userName = false;
	console.log((new Date()) + ' Connection accepted.');
	//send todays conversations
 	db.getTodaysConversation(function(history){
 	sendMessage('updateContent', history)
 	sendHistoryConversations()
 })


connection.on('message', function(message) {
if (message.type === 'utf8') {
	var data = JSON.parse(message.utf8Data)
	switch (data.type){
		case 'getAccessToken':
			hash = logIn(data.data, this)
			sendMessage('getAccessToken', hash)
		break;
		case 'message':
			db.saveMessage(data, function(data){
				broadcast('message', data)	
			})
		break;
		case 'getConversation':
			db.getConversation(data, function(history){
				sendMessage('updateContent', history)
			})
		break;
		default:
			console.log("Could not determine message type: "+message.type)
		break;
}}});

connection.on('close', function(connection) {
		console.log((new Date()) + " Peer "
			+ connection.remoteAddress + " disconnected.");
		username = remote_to_username[connection.remoteAddress]
		global.active_users[username] = false
		sendActiveUsers()
	});

function sendMessage(type, data){
	connection.sendUTF(JSON.stringify({ type: type, data: data}));	
}

function sendHistoryConversations(){
		db.getConversations(function(conversations){
				sendMessage('getConversations', conversations)
			})
}

});

function broadcast(type, data){
	for (var i=0; i < clients.length; i++) {
		clients[i].sendUTF(JSON.stringify({ type: type, data: data}));
	}
}

function sendActiveUsers(){
	broadcast('active_users', global.active_users)
}




function logIn(username, connection){
	console.log(username)
	console.log(connection.remoteAddress)
	hash = username +" HASHED"
	global.active_users[username] = hash
	remote_to_username[connection.remoteAddress] = username
	sendActiveUsers()
	return hash
}

