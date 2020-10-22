const NaturalLanguageUnderstandingV1 = require('ibm-watson/natural-language-understanding/v1.js');

class WatsonNLU {
    constructor(){
        this.nlu = new NaturalLanguageUnderstandingV1({version: '2019-07-12'});
    }

    getEntities(url){
        return new Promise((resolve, reject)=>{
            const nluOptions = {
                url: url,
                features: {
                    semantic_roles: {
                        entities: true
                    }
                }
            };

            this.nlu.analyze(nluOptions, (err, res)=>{
                if(err) reject(err);
                else resolve(res.result?.semantic_roles);
            });
        });
    }

    parseWatsonResults(watsonResults){
        let parsedResults = watsonResults.flatMap(record => this.parseWatsonResult(record)).filter(x => !!x);
        return this.consolidateWatsonResults(parsedResults)
    }

    parseWatsonResult(watsonObj){
        let persons   = [];
        let companies = [];
        let jobTitles = [];
        let data      = {};

        // Consolidate entities found from Watson
        let entitySubject = watsonObj.subject?.entities || [];
        let entityObject  = watsonObj.object?.entities || [];

        let entities = [...entitySubject, ...entityObject];

        if(entities.length==0){
            return;
        }

        // Sort entities by type
        entities.map(entity => {
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
                    data[entity.type] = data[entity.type] || [];
                    data[entity.type].push(entity.text);
                    break;
            }
        });

        // Format and return Persons array
        return persons.map(person => {
            return {
                name: person,
                associates: persons.filter((x)=> x != person),
                companies: companies,
                jobTitles: jobTitles,
                data: data,
                countMentions: 1
            }
        });
    }

    consolidateWatsonResults(watsonResults){
        let entityDictionary = {};
        watsonResults.map((record)=>{
            if(record.name in entityDictionary){
                let oldRecord = entityDictionary[record.name];
                entityDictionary[record.name] = {
                    name         : entityDictionary[record.name].name,
                    associates   : [...oldRecord.associates, record.associates],
                    companies    : [...oldRecord.companies, record.companies],
                    jobTitles    : [...oldRecord.jobTitles, record.jobTitles],
                    data         : {...oldRecord.data, ...record.data},
                    countMentions: oldRecord.countMentions + 1
                }
            }else{
                entityDictionary[record.name] = record;
            }
        });
        return entityDictionary;
    }
}

module.exports = WatsonNLU;