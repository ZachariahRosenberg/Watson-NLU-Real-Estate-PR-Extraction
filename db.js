const mongoose = require('mongoose');

class DB {
    constructor(){
        mongoose.connect('mongodb://localhost/watsonDB', (err)=>{
            if(err) console.log(err);
        })

        this.connection = mongoose.connection,
        this.model = this.createSchema()
    }

    createSchema(){
        const watsonSchema = mongoose.Schema({
            name         : String,
            associates   : Array,
            jobTitles    : Array,
            companies    : Array,
            data         : Array,
            countMentions: Number
        });

        return mongoose.model('Entities', watsonSchema);
    }

    upsert(records){
        var promises = Object.keys(records).map((record)=>{
            var query = {name: record};
            var data = {$addToSet:{
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
            return this.update(query, data, options);
        });
        return Promise.all(promises);
    }

    update(query, data, options){
        return new Promise((resolve, reject)=>{
            this.model.update(query, data, options, (err, res)=>{
                if(err) reject(err);
                else resolve(res);
            });
        });
    }

    disconnect(){
        mongoose.disconnect();
    }
}

module.exports = DB;