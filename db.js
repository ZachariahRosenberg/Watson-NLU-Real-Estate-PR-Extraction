const mongoose = require('mongoose');

const connect = ()=>{
	mongoose.connect('mongodb://localhost/watsonDB', (err)=>{
		if(err) console.log(err);
	});
	return mongoose.connection;
}

const createSchema = ()=>{

	const watsonSchema = mongoose.Schema({
		name: String,
		associates: Array,
		jobTitles: Array,
		companies: Array,
		data: Array,
		countMentions: Number
	});
	return mongoose.model('sources', watsonSchema);
}

//needed to wrap update in promise
const update = (model, query, data, options)=>{
	return new Promise((resolve, reject)=>{
		model.update(query, data, options, (err, res)=>{
	        if(err) reject(err);
	        else resolve(res);
	    });
	});
}

const upsert = (model, records)=>{
	var promises = Object.keys(records).map((record)=>{
		var query = {name: record};
		var updateParam = {$addToSet:{
	             	associates: {
	             		$each: records[record].associates
	             	},
	             	companies: {
	             		$each: records[record].companies
	             	},
	             	jobTitles: {
	             		$each: records[record].jobTitles
	             	},
	             	data: records[record].data,
        		},
        		$set:{countMentions: records[record].countMentions}};
        var options = {upsert: true, strict: false};
        return update(model, query, updateParam, options);
	});
	return Promise.all(promises);
}


module.exports.connect = connect;
module.exports.createSchema = createSchema;
module.exports.disconnect = mongoose.disconnect;
module.exports.upsert = upsert;