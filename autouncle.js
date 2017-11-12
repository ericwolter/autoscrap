// read config
const request = require('request');
const fs = require('fs');
const async = require('async');
const cheerio = require('cheerio');
const sanitize = require("sanitize-filename");
const config = require('./config.json');

function randomInt(low, high) {
  return Math.floor(Math.random() * (high - low) + low);
}

function parseResultPage(body) {
  var cars = []
  const $ = cheerio.load(body);
  $('.car-list-item').each(function(i, elem) {
    cars.push({
      // "title" : $(this).find('.car-title').first().text().trim(),
      "price" : parseFloat($(this).find('.pricing .price').first().attr('content').trim()),
      "year" : parseInt($(this).find('.year span').first().text().trim()),
      "km" : parseInt($(this).find('.km span').first().text().trim().replace('.','')),
      "hp" : parseInt($(this).find('.hp span').first().text().trim())
    });
  });

  var hasNextPage = !$('.page_nav .next').hasClass('disabled');
  return [hasNextPage, cars];
}

var autouncle = config.websites.autouncle;
async.mapLimit(autouncle.cars, 5, function(car, callback) {
  var params = car.filters
  var nextPage = 1
  var results = []
  async.doWhilst(function(callback) {
    params[autouncle.paging] = nextPage
    waitPeriod = randomInt(3000, 6000);
    console.log('Requesting page', nextPage, 'for', car.name, 'waiting for ' + waitPeriod + 'ms.')
    setTimeout(function() {
      request({url:autouncle.url, qs:params, gzip: true}, function(err, response, body) {
        if(err) {
          console.log(err);
          callback(err, null);
          return;
        }
        result = parseResultPage(body);
        hasNextPage = result[0];
        found_cars = result[1];
        console.log('Found', found_cars.length, 'for', car.name);
        results = results.concat(found_cars);
        if(hasNextPage) {
          nextPage++;
        } else {
          nextPage = -1;
        }
        nextPage = -1;
        callback(null);
      });
    }, waitPeriod);
  }, function() {
    return nextPage > 0;
  }, function(err) {
    callback(err, results);
  });
}, function(err, results) {
  if(err) { console.log(err); return; }
  var data = []
  for (var i = 0; i < results.length; i++) {
    var car = {
        "name" : autouncle.cars[i].name,
        "results" : results[i]
    };
    console.log('Got', car.results.length, 'results in total for', car.name);
    fs.writeFileSync('./data/'+sanitize(car.name)+'.json', JSON.stringify(car.results) , 'utf-8');
  }
});
