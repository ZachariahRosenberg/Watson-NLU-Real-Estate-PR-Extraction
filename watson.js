const _ = require('lodash');

//Watson Constants
const NaturalLanguageUnderstandingV1 = require('watson-developer-cloud/natural-language-understanding/v1.js');

const nlu = new NaturalLanguageUnderstandingV1({
  username: '3e0974ae-0657-420d-893a-38ed5906e7fc',
  password: 'gd085lnM6rmM',
  version_date: NaturalLanguageUnderstandingV1.VERSION_DATE_2017_02_27
});

//Watson Functions
const getEntities = (url)=>{
	const options = {
		url: url,
		features: {
			semantic_roles: {
				entities: true
			}
		}
	};
	return new Promise((resolve, reject)=>{
		nlu.analyze(options, (err, res)=>{
			if(err) reject(err);
			else resolve(res.semantic_roles);
		});
	});
}
//Should be able to combine this with processWatsonRecords
const createWatsonDictionary = (watsonRecords)=>{
	var dictionary = {};
	watsonRecords.map((record)=>{
		if(record.name in dictionary){
			dictionary[record.name] = {
				name: dictionary[record.name].name,
				associates: _.union(dictionary[record.name].associates, record.associates),
				companies:  _.union(dictionary[record.name].companies, record.companies),
				jobTitles:  _.union(dictionary[record.name].jobTitles, record.jobTitles),
				data: Object.assign(dictionary[record.name].data, record.data),
				countMentions: dictionary[record.name].countMentions + 1
			}
		}else{
			dictionary[record.name] = record;
		}
	});
	return dictionary;
}

const processWatsonRecords = (watsonArray)=>{
	return new Promise((resolve, reject)=>{
		var records = [];
		watsonArray.map((record)=>{
			try{
				var record = processWatsonRecord(record);
				if(record.length>0){
					records = records.concat(record);
				}
			}catch(err){
				reject(err);
			}
		});
		resolve(records);
	});
}

const processWatsonRecord = (watsonJSON)=>{
	var results = [];
	var persons = [];
	var companies = [];
	var jobTitles = [];
	var data = {};

	var subj = watsonJSON.subject || [{entities:[]}];
	var obje = watsonJSON.object || [{entities:[]}];

	var subjEntities = subj.entities || [];
	var objEntities = obje.entities || [];
	
	var entities = subjEntities.concat(objEntities);
	
	if(entities.length==0){
		return results;
	}

	entities.map((entity)=>{
		switch(entity.type){
			case 'Person':
				persons.push(entity.text);
				break;
			case 'Company':
				companies.push(entity.text);
				break;
			case 'JobTitle':
				jobTitles.push(entity.text);
				break;
			default:
				data[entity.type] = data[entity.type] || {};
				data[entity.type] = entity.text;
				break;
		}
	});

	persons.map((person)=>{
		results.push({
			name: person,
			associates: persons.filter((x)=> x != person),
			companies: companies,
			jobTitles: jobTitles,
			data: data,
			countMentions: 1
		});
	});
	return results;
}

module.exports.getEntities = getEntities;
module.exports.processWatsonRecords = processWatsonRecords;
module.exports.createWatsonDictionary = createWatsonDictionary;