$(function () {
	"use strict";

var content = $('#chat-content-wrapper');
var input = $('#chat-input');
var status = $('#status');


var myColor = "black"

var username = "j.kostrzews2"
var accessToken = false;

window.WebSocket = window.WebSocket || window.MozWebSocket;

if (!window.WebSocket) {
	content.html($('<p>', { text: 'Sorry, but your browser doesn\'t '
		+ 'support WebSockets.'} ));
	input.hide();
	$('span').hide();
	return;
}
var connection = new WebSocket('ws://127.0.0.1:1337');

connection.onopen = function () {
connection.send(JSON.stringify({type:'getAccessToken', data:username}));
};

connection.onerror = function (error) {
content.html($('<p>', { text: 'Sorry, but there\'s some problem with your '
	+ 'connection or the server is down.' } ));
};

connection.onmessage = function (message) {
try {
	var json = JSON.parse(message.data);
} catch (e) {
	console.log('Invalid JSON format: ', message.data);
	return;
}

switch (json.type){
	case 'getAccessToken':
		if (!accessToken){
			window.accessToken = json.data
		}	
	break;
	case 'updateContent':
		updateContentHtml(json.data[0].conversation_id)
		for (var i=0; i < json.data.length; i++) {
			addMessage(json.data[i].author, json.data[i].text, new Date(json.data[i].date));
		}
	break;
	case 'message':
		addMessage(json.data.author, json.data.text, new Date(json.data.date));
	break;
	case 'active_users':
		updateActiveUsers(json.data)
	break;
	case 'getConversations':
		updateConversations(json.data)
	break;
	default:
		console.log('Hmm..., I\'ve never seen JSON like this: ', json);
	break;
}
}

input.keyup(function(e) {
	if (e.keyCode === 13) {
		if(e.shiftKey){
			if (!this.value.endsWith('\n'))
            	this.value =  this.value +'\n'
            e.stopPropagation()
            return
        }
        else{
        	var msg = $(this).val().replace(/\n/g, "<br/>");
			if (!msg) {
				return;
			} 
		connection.send(JSON.stringify({type:'message', text:msg, accessToken:accessToken, author:username}));
		$(this).val('');
	}
	}
});

/*
setInterval(function() {
	if (connection.readyState !== 1) {
		status.text('Error');
		input.attr('disabled', 'disabled').val('Unable to comminucate '
			+ 'with the WebSocket server.');
	}
}, 3000);
*/

function addMessage(author, text, date) {
	content.append('<p><b>' + author + '</b> <small>(' +
		+ (date.getHours() < 10 ? '0' + date.getHours() : date.getHours()) + ':'
		+ (date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes())
		+ ')</small><br/> ' + text + '</p>');
	$(content).scrollTop($(content)[0].scrollHeight);
}

function updateActiveUsers(uDict){
	$('#active_users').html('')
	for (var username in uDict){
		status = uDict[username]
		var entry = $('#active_user_entry').clone()
		$(entry).find('#username').text(username)
		if (!status){
			$(entry).find('#user-status').addClass('offline')
		}
		$('#active_users').append($(entry).show())
	}
}

function updateConversations(json){
	var rows = json.rows
	for (var r in rows){
		var row = rows[r]
		var entry = $('#conversations_history_entry_template').clone()
		$(entry).attr('id', 'conversations_history_entry')
		$(entry).attr('conversation-id', row.id)
		if (r==0){
			$(entry).find('.content').text('Today')
			$(entry).find('.content').addClass('active')
		}else{
			$(entry).find('.conversation-date').text(new Date(row.date).toPgDate())
			$(entry).find('.conversation-count-value').text(row.count)
		}

		$(entry).click(function(e){
			var entry = $(e.target).closest('#conversations_history_entry')
			
			console.log(entry)
			connection.send(JSON.stringify({type:'getConversation', id:$(entry).attr('conversation-id')}));
		})
		$('#conversations-history-list').append($(entry).show())
	}
}

Date.prototype.toPgDate = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   return dd + "-" + mm + "-" + yyyy
  };

function updateContentHtml(id){
	$(content).html('')
	$('#conversations-history-list').find('.active').each(function(i, c){
		console.log(c)
		$(c).removeClass('active')
	})
	$('#conversations-history-list').find("[conversation-id='"+id+"']").find('.content').addClass('active')
}

}); 

