const ArticleScrape = require("./articleScraper");

let cliArgs = process.argv.slice(2);

articleScrape = new ArticleScrape(cliArgs[0], cliArgs[1]);

articleScrape.beginScrape()