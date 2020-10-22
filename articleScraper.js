const https     = require('https');
const DB        = require('./db');
const WatsonNLU = require('./watson-nlu');

const watson = new WatsonNLU()

class ArticleScrape {
    constructor(firstArticleIdx=0, lastArticleIdx=6968){
        this.baseUrl         = 'http://www.multifamilybiz.com/PressReleases/';
        this.firstArticleIdx = firstArticleIdx;
        this.articleIdx      = lastArticleIdx;
        this.db              = new DB();
        this.ready           = false;

        // On connect, create Mongo model
        this.db.connection.once('open', function(){
            this.ready = true;
        }.bind(this));
    }

    beginScrape(){

         // Error check
         if(!this.ready){
            console.error('DB could not be initialized. Check the console.error stream for details.')
            return;
        }

        while(this.articleIdx > this.firstArticleIdx && this.articleIdx >= 0){

            this.retrieveEntitiesFromArticle().then(entities => {
                this.db.upsert(entities);
            }).catch(err=>{
                console.error(`Err on article ${this.articleIdx}: ${err}`);
            });

            this.articleIdx--;

        }

        console.log('Fin!')
    }

    retrieveEntitiesFromArticle(){
        return new Promise((resolve, reject)=>{
            // Check article exists
            let url = this.baseUrl + this.articleIdx;

            this.checkURLExists(url).then(()=>{
                // article is good, send to Watson
                return watson.getEntities(url);
            }).then((watsonEntities)=>{
                // parse watson entities
                let processedRecords = watson.parseWatsonResults(watsonEntities);
                resolve(processedRecords);
            })
            .catch((err)=>{
                // no article or entities
                reject(err);
            })
        });
    }

    checkURLExists(url){
        return new Promise((resolve, reject)=>{
            https.get(url, (res)=>{
                if(res.statusCode==200) resolve();
                else reject(res);
            });
        });
    }
}

module.exports = ArticleScrape;