const db = require('./db');
const watson = require('./watson');
const scrapeTools = require('./scrapeTools');

//To refactor
const http = require('http');
const mongoose = require('mongoose');

const baseUrl = 'http://www.multifamilybiz.com//PressReleases/';
var articleNum = 0;//1175;//2376;//2613;//2813;//3617;//4009;//6744;//6968;
var url;
const maxLoop = 2;
var curLoop = 0;

//Connect to Database
var model;
var dbRes = db.connect();
dbRes.on('error', ()=>console.log('error'));
dbRes.once('open', ()=>{
	model = db.createSchema();
	//start magic
	main();
});

/***************************  Main  ***************************/
async function main(){
	if(articleNum == 0){
		console.log('fin!');
		return;
	}
	//set url
	url = baseUrl+articleNum;

	//check url is valid article
	console.log('checking article: '+articleNum);
	try{await scrapeTools.checkURLExists(url)}
	catch(err){console.log('article '+articleNum+' is no good'); nextTick(); return;}

	//send url to watson
	console.log('sending to watson article num: '+articleNum);
	var watsonResponse;
	try{watsonResponse = await watson.getEntities(url)}
	catch(err){console.error(err);return;}

	//process results
	console.log('processing records');
	var processedRecords;
	var names = {};
	try{
		processedRecords = await watson.processWatsonRecords(watsonResponse);
		names = watson.createWatsonDictionary(processedRecords);
	}
	catch(err){console.error(err);return;}

	//save to mongo
	console.log('saving to mongo '+Object.keys(names).length+' records');
	try{
		await db.upsert(model, names);
		console.log('promises returned');
		nextTick();
	}catch(err){console.error(err); return;}
}

const nextTick = ()=>{
	console.log(curLoop);
	articleNum--;
	curLoop += 1;
	main();
	return;
}