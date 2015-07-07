var pg = require('pg');

var conString = "postgres://jkostrzewski:mike9999@localhost/daily-chat-db";

var client = new pg.Client(conString);

function connect(){
	client.connect(function(err) {
  	if(err) {
	    return console.error('could not connect to postgres', err);
  		}
  	});
}

function disconnect(){
	client.end();
}


function saveMessage(message, callback){
	timestamp = new Date()
	day_date = timestamp.toPgDate()

	client.query("select id from conversations where date = $1", [day_date], function(err, result) {
	if (result.rows.length == 0){
		client.query("insert into conversations (date) values ($1);", [day_date], function(err, result) {
			saveMessage(message, callback)
		})	
	}else{
		conversation_id = result.rows[0].id		
		text = message.text
		date = message.date
		author = message.author
		message.date = timestamp
		console.log(text)
		client.query("insert into entries (conversation_id, text, date, author) "+
			"values ($1, $2, $3, $4)", [conversation_id, text, timestamp, author], function(err, result){
			if (callback){
				console.log(message)
					callback(message)
				}
			})
	}	   
	})
}

function getTodaysConversation(callback){
	day_date = new Date().toPgDate()
	client.query("select e.text, e.date, e.author, e.conversation_id \
					from entries e join conversations c on e.conversation_id = c.id \
					where c.date = $1 \
					order by e.date;", [day_date], function(err, result){
						console.log(result.rows)
						if (callback){
							callback(result.rows)
						}
					})
}

function getConversation(data, callback){
	client.query("select e.text, e.date, e.author, e.conversation_id \
					from entries e join conversations c on e.conversation_id = c.id \
					where c.id = $1 \
					order by e.date;", [data.id], function(err, result){
						if (callback){
							callback(result.rows)
						}
					})	
}

function getConversations(callback){
	client.query("select c.id, c.date, c.title, count(*) as count \
				from entries e join conversations c on e.conversation_id = c.id \
				group by c.id, c.date, c.title \
				order by c.date desc;", [], function(err, result){
					if (callback){
						callback(result)
					}
				})
}


Date.prototype.toPgDate = function() {
   var yyyy = this.getFullYear().toString();
   var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
   var dd  = this.getDate().toString();
   return yyyy + "-" + mm + "-" + dd
  };

module.exports.connect = connect;
module.exports.disconnect = disconnect;
module.exports.saveMessage = saveMessage;
module.exports.getTodaysConversation = getTodaysConversation;
module.exports.getConversations = getConversations;
module.exports.getConversation = getConversation;