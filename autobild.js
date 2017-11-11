var request = require('request');
var async = require('async');

var base_url = 'http://www.autobild.de/bilder/die-neue-dauertest-rangliste-ab-2014--5130184.html#bild'
const regex = /<h3.*priceRangeMid.*>.* ([\d+\.]+)<\/h3>/;

var pictures = [];
for (var i = 1; i <= 101; i+=1) {
  pictures.push(i);
}

async.mapLimit(pictures, 4, function(picture, callback) {
  console.log('querying ' + picture + '...');
  let url = base_url + picture
  let item = {id: picture, name: '', errors: -1, grade: ''};
  request.get(url, function(err, res, body) {
    if(err) {
      callback(err, item);
    } else {
      let m;
      if ((m = regex.exec(body)) !== null) {
        item.price = parseInt(m[1] * 1000);
        callback(null, item);
      } else {
        callback('no average price found', item);
      }
    }
  });
}, function(err, results) {
  for (result of results) {
    console.log('2014$' + result.mileage + '$' + result.price);
  }
});
