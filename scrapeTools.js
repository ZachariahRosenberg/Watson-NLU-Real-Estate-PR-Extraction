const http = require('http');

const checkURLExists = (url)=>{
	return new Promise((resolve, reject)=>{
		http.get(url, (res)=>{
			if(res.statusCode==200) resolve();
			else reject();
		});
	});
}

module.exports.checkURLExists = checkURLExists;