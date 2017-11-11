var request = require('request');
var fs = require('fs');
var async = require('async');

var cars = [
  // {
  //   identifier: 'opel_astra_diesel_165ps',
  //   url: 'https://www.autoscout24.de/fahrzeugbewertung/ergebnis?makeId=54&transmissionId=M&genlnk=navi&mileage=10000&genlnkorigin=de-vm-individual-price-estimation-result&vehicleGroupId=1916_6_5&fuelId=D&buyerSeller=3&power=121&action=calc&firstRegistrationYear=2014&modelSize=light',
  // },
  {
    identifier: 'opel_astra_diesel_136ps',
    url: 'https://www.autoscout24.de/fahrzeugbewertung/ergebnis?makeId=54&transmissionId=M&genlnk=navi&mileage=10000&genlnkorigin=de-vm-individual-price-estimation-result&vehicleGroupId=1916_6_5&fuelId=D&buyerSeller=3&power=100&action=calc&firstRegistrationYear=2014&modelSize=light',
  },
  // {
  //   identifier: 'volvo_v40_diesel_114ps',
  //   url: 'https://www.autoscout24.de/fahrzeugbewertung/ergebnis?makeId=73&transmissionId=M&genlnk=navi&mileage=10000&genlnkorigin=de-vm-individual-price-estimation-result&vehicleGroupId=2082_6_5&fuelId=D&buyerSeller=3&power=84&action=calc&firstRegistrationYear=2014&modelSize=light',
  // },
  // {
  //   identifier: 'seat_leon_diesel_110ps',
  //   url: 'https://www.autoscout24.de/fahrzeugbewertung/ergebnis?makeId=64&transmissionId=M&genlnk=navi&mileage=10000&genlnkorigin=de-vm-individual-price-estimation-result&vehicleGroupId=15869_6_5&fuelId=D&buyerSeller=3&power=81&action=calc&firstRegistrationYear=2014&modelSize=light',
  // },
  // {
  //   identifier: 'bmw_1er_diesel_143ps',
  //   url: 'https://www.autoscout24.de/fahrzeugbewertung/ergebnis?makeId=13&transmissionId=M&genlnk=navi&mileage=10000&genlnkorigin=de-vm-individual-price-estimation-result&vehicleGroupId=18481_6_5&fuelId=D&buyerSeller=3&power=105&action=calc&firstRegistrationYear=2014&modelSize=light',
  // },
  // {
  //   identifier: 'vw_golf_diesel_110ps',
  //   url: 'https://www.autoscout24.de/fahrzeugbewertung/ergebnis?makeId=74&transmissionId=M&genlnk=navi&mileage=30000&genlnkorigin=de-vm-individual-price-estimation-result&vehicleGroupId=2084_6_5&fuelId=D&buyerSeller=3&power=81&action=calc&firstRegistrationYear=2014&modelSize=light',
  // },
];

let filename = 'cars.csv';
if(fs.existsSync(filename)) {
  fs.unlink(filename);
}
const regex = /<h3.*priceRangeMid.*>.* ([\d+\.]+)<\/h3>/;

var current_year = 2017
var avg_mileage_per_year = 15000
var min_mileage_per_year = 5000
var max_mileage_per_year = 40000

var years = [2012,2013,2014,2015,2016];

function randomInt(low, high) {
    return Math.floor(Math.random() * (high - low) + low);
}

async.mapLimit(cars, 1, function(car, callback) {
  let base_url = car.url;
  async.mapLimit(years, 2, function(year, callback) {
    let year_url = base_url.replace(/firstRegistrationYear=\d+/, 'firstRegistrationYear='+year);

    let year_delta = current_year - year;
    let min_milage = min_mileage_per_year * year_delta;
    let max_milage = max_mileage_per_year * year_delta;

    let mileages = [];
    for (var i = min_milage; i <= max_milage; i+=1000) {
      mileages.push(i);
    }

    async.mapLimit(mileages, 4, function(mileage, callback) {
      console.log('querying ' + car.identifier + ', ' + year + ', ' + mileage + '...');
      let url = year_url.replace(/mileage=\d+/, 'mileage='+mileage);
      let item = {car: car.identifier, year: year, mileage: mileage, price: -1};

      setTimeout(function() {
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
      }, randomInt(10,500));

    }, function(err, results) {
      callback(err, results);
    });
  }, function(err, years) {
    callback(err, years);
  });
}, function(err, cars) {
  if(err) {
    console.log(err);
  }

  for (c = 0; c < cars.length; ++c) {
    let car = cars[c];
    for (y = 0; y < car.length; ++y) {
      let year = car[y];
      for (m = 0; m < year.length; ++m) {
        let result = year[m];
        let line = result.car + ';' + result.year + ';' + result.mileage + ';' + result.price;
        console.log(line);
        fs.appendFileSync(filename, line + '\n');
      }
    }
  }
});
