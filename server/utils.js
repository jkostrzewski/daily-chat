fs = require('fs');

function readUsersFromFile(){
	fs.readFile('./users.json', 'utf8', function (err,data) {
  	if (err) {
	    return console.log(err);
  	}
  	active_users = {}
  	users = JSON.parse(data).accepted_users
  	for (var u in users){
		active_users[users[u]] = false
  	}
  	return active_users
	});
}

module.exports.readUsersFromFile = readUsersFromFile;