
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var async = require('async');
var http = require("http");
var request = require('request');
var phantomCheerio = require('phantom-cheerio')();
var JapanRestaurant = mongoose.model('JapanRestaurant');
var JapanSight = mongoose.model('JapanSight');
var JapanHotel = mongoose.model('JapanHotel');

var _saveToDb = function(param) {
  JapanRestaurant.findByLink(param.dp_link, function(err, japanRestaurant) {
    if(!japanRestaurant) {
      japanRestaurant = new JapanRestaurant(param);
      japanRestaurant.save(function(err) {
        console.log(err || 'Save ' + param.name + ' success!');
      })
    }
  })
}

var _loadShop = function(shop_link, city, isEnd) {
  isLoadingShop = true;
  city = city || 'tokyo';
  JapanRestaurant.findByLink(shop_link, function(err, japanRestaurant) {
    if(!japanRestaurant) {
      phantomCheerio.open(dp + shop_link, function($) {
        var param = {
          dp_link: shop_link,
          city: city,
          michelin_level: michelin_level
        };
        var name = $('.shop-name').contents()[0];
        name = $(name).text().trim();
        param.name = name;

        $('.brief-info span.item').each(function() {
          var text = $(this).text();
          var subs = [{
            name: '人均',
            key: 'price'
          }, {
            name: '口味',
            key: 'taste'
          }, {
            name: '环境',
            key: 'env'
          }, {
            name: '服务',
            key: 'service'
          }]
          for(var i = 0; i < subs.length; i++) {
            if(text.indexOf(subs[i].name) === 0) {
              var val = parseFloat(text.substring(3));
              val = isNaN(val) ? 0 : val;
              param[subs[i].key] = val;
            }
          }
        })

        var addressObj = $('.expand-info.address');
        var address = addressObj.find('[itemprop$="region"]').text().trim();
        var street = addressObj.find('[itemprop$="street-address"]').attr('title').trim();
        param.address = address + ' ' + street;

        var tels = $('.expand-info.tel').find('[itemprop$="tel"]');
        var tel = [];
        for(var i = 0; i < tels.length; i++) {
          tel.push($(tels[i]).text().trim());
        }
        param.tel = tel.join(' ');

        $('.info-name').each(function() {
          var text = $(this).text();
          if(text.indexOf('营业时间') === 0) {
            var open_time = $(this).next('.item').text().trim();
            param.open_time = open_time;
          }
        })

        console.log(shop_no + ': ' + param.name);

        shop_no++;
        isLoadingShop = false;
        if(isEnd) {
          isLoadingPage = false;
          index_page++;
        }

        _saveToDb(param);
      })
    } else {
      console.log('you have added this restaurant!');
      shop_no++;
      isLoadingShop = false;
      if(isEnd) {
        isLoadingPage = false;
        index_page++;
      }
    }
  });
}

var _loadPage = function(local, local_link) {
  isLoadingPage = true;

  var __eachLoad = function(shops, $) {
    shops.each(function(i) {
      var href = $(this).attr('href');
      var isEnd = i === (shops.length - 1);
      var _checkAndLoadShop = function() {
        setTimeout(function() {
          if(!isLoadingShop) {
            _loadShop(href, local, isEnd);
          } else {
            _checkAndLoadShop();
          }
        }, time_gap);
      }
      _checkAndLoadShop();
    })
  }

  phantomCheerio.open(dp + local_link + index_page, function ($) {
    var shops = $('li.shopname a.BL');
    __eachLoad(shops, $);
  })
}

var _load = function(local, local_link, pages) {
  var t = setInterval(function() {
    if(!isLoadingPage) {
      if(index_page <= pages) {
        _loadPage(local, local_link);
      } else {
        clearInterval(t);
      }
    }
  }, time_gap);
}

var dp = 'http://www.dianping.com';
var isLoadingShop = false;
var isLoadingPage = false;
var shop_no = 1;
var time_gap = 3000;

var index_page = 1;
var all_page = 1;
var michelin_level = 3;

exports.load = function(req, res) {
  //东京
  var city = 'osaka';
  var city_link = '/' + city + '/food/n1v72003p';

  _load(city, city_link, all_page);

  res.send({
    success: true
  })
}





var FetchSight = (function() {
  var qy = 'http://place.qyer.com/';
  var city = 'osaka'; //tokyo kyoto osaka
  var category = 'shopping';
  var city_link = '/' + city + '/shopping/?page=';

  var isLoadingShop = false;
  var isLoadingPage = false;
  var shop_no = 1;
  var time_gap = 3000;

  var index_page = 3;
  var all_page = 8;

  var _saveToDb = function(param) {
    JapanSight.findByLink(param.link, function(err, japanSight) {
      if(!japanSight) {
        japanSight = new JapanSight(param);
        japanSight.save(function(err) {
          console.log(err || 'Save ' + param.name + ' success!');
        })
      }
    })
  }

  var _loadShop = function(sight_link, city, isEnd) {
    isLoadingShop = true;
    city = city || 'tokyo';
    JapanSight.findByLink(sight_link, function(err, japanSight) {
      if(!japanSight) {
        phantomCheerio.open(sight_link, function($) {
          var param = {
            link: sight_link,
            city: city,
            category: category
          };

          param.name = $('h1.cn a').text().trim();
          param.en_name = $('h1.en a').text().trim();

          param.des = $('.poiDet-detail').text().trim() || '';

          var rank = $('.rank span');
          if(rank && rank.length) {
            param.rank = parseInt(rank.text().substring(1));
          }

          $('.poiDet-tips li span.title').each(function() {
            var text = $(this).text();
            var subs = [{
              name: '地址',
              key: 'address'
            }, {
              name: '到达方式',
              key: 'access'
            }, {
              name: '开放时间',
              key: 'open_time'
            }, {
              name: '门票',
              key: 'ticket'
            }]
            for(var i = 0; i < subs.length; i++) {
              if(text.indexOf(subs[i].name) > -1) {
                var content = $(this).parent().find('.content')[0];
                var val = $(content).find('p')[0].childNodes[0].data;
                param[subs[i].key] = val;
              }
            }
          })

          console.log(shop_no + ': ' + param.name);

          shop_no++;
          isLoadingShop = false;
          if(isEnd) {
            isLoadingPage = false;
            index_page++;
          }

          _saveToDb(param);
        })
      } else {
        console.log('you have added ' + japanSight.name + '!');
        shop_no++;
        isLoadingShop = false;
        if(isEnd) {
          isLoadingPage = false;
          index_page++;
        }
      }
    });
  }

  var _loadPage = function(local, local_link) {
    isLoadingPage = true;

    var __eachLoad = function(shops, $) {
      shops.each(function(i) {
        var href = $(this).attr('href');
        var isEnd = i === (shops.length - 1);
        var _checkAndLoadShop = function() {
          setTimeout(function() {
            if(!isLoadingShop) {
              _loadShop(href, local, isEnd);
            } else {
              _checkAndLoadShop();
            }
          }, time_gap);
        }
        _checkAndLoadShop();
      })
    }

    phantomCheerio.open(qy + local_link + index_page, function ($) {
      var shops = $('.cntBox h3.title a');
      __eachLoad(shops, $);
    })
  }


  var _load = function(local, local_link, pages) {
    var t = setInterval(function() {
      if(!isLoadingPage) {
        if(index_page <= pages) {
          _loadPage(local, local_link);
        } else {
          clearInterval(t);
        }
      }
    }, time_gap);
  }

  var load = function() {
    _load(city, city_link, all_page);
  }

  return {
    load: load
  }
})()

exports.loadSight = function(req, res) {
  FetchSight.load();
  res.send({
    success: true
  })
}

/*
var _getLocationFromBaidu = function(fetch, lat, lng) {
  if(lat && lng && lat !== '' && lng !== '') {
    request('http://api.zdoz.net/bd2wgs.aspx?lat=' + lat + '&lng=' + lng,
      function(error, response, body) {
        if(!error && response.statusCode == 200) {
          var ret = JSON.parse(body);
          if(ret && ret.Lng && ret.Lat) {
            fetch.lng = ret.Lng;
            fetch.lat = ret.Lat;
            fetch.save(function(err) {
              console.log(err || 'update fetch: ' + fetch.name);
            })
          }
        }
      }
    )
  }
}*/

var FetchHotel = (function() {
  var baseUrl = 'http://www.dianping.com';
  var city = 'osaka'; //tokyo kyoto osaka
  var city_link = '/' + city + '/hotel/p';

  var isLoadingShop = false;
  var isLoadingPage = false;
  var shop_no = 1;
  var time_gap = 3000;

  var index_page = 1;
  var all_page = 50;

  var _saveToDb = function(param) {
    JapanHotel.findByLink(param.link, function(err, japanHotel) {
      if(!japanHotel) {
        japanHotel = new JapanHotel(param);
        japanHotel.save(function(err) {
          console.log(err || 'Save ' + param.name + ' success!');
        })
      }
    })
  }

  var _loadShop = function(link, city, param, isEnd) {
    isLoadingShop = true;
    city = city || 'tokyo';
    JapanHotel.findByLink(link, function(err, japanHotel) {
      if(!japanHotel) {
        phantomCheerio.open(link, function($) {
          param.link = link;
          param.city = city;

          var name = $('.shop-name').contents()[0];
          name = $(name).text().trim();
          param.name = name;
          param.en_name = $('.shop-name span').text().trim();

          param.address = $($('.shop-address').contents()[0]).text().trim();
          if(param.address.indexOf('地址：') === 0) {
            param.address = param.address.substring(3);
          }

          param.railway = $('.shop-address span').text().trim();

          console.log(shop_no + ': ' + param.name);
          console.log(param);

          shop_no++;
          isLoadingShop = false;
          if(isEnd) {
            isLoadingPage = false;
            index_page++;
          }

          _saveToDb(param);
        })
      } else {
        console.log('you have added ' + japanHotel.name + '!');
        shop_no++;
        isLoadingShop = false;
        if(isEnd) {
          isLoadingPage = false;
          index_page++;
        }
      }
    });
  }

  var _loadPage = function(local, local_link) {
    isLoadingPage = true;

    var __eachLoad = function(shops, $) {
      shops.each(function(i) {
        var href = $(this).attr('href');
        var hotelMain = $(this).parent().parent();
        var region = hotelMain.find('p.place a').text().trim();
        var tags = hotelMain.find('p.hotel-tags span');
        var param = {
          region: region,
          tags: []
        }
        tags.each(function(index, tag) {
          param.tags.push($(tag).text().trim());
        })
        var isEnd = i === (shops.length - 1);
        var _checkAndLoadShop = function() {
          setTimeout(function() {
            if(!isLoadingShop) {
              _loadShop(baseUrl + href, local, param, isEnd);
            } else {
              _checkAndLoadShop();
            }
          }, time_gap);
        }
        _checkAndLoadShop();
      })
    }

    phantomCheerio.open(baseUrl + local_link + index_page, function ($) {
      var shops = $('.hotel-name-link');
      __eachLoad(shops, $);
    })
  }


  var _load = function(local, local_link, pages) {
    var t = setInterval(function() {
      if(!isLoadingPage) {
        if(index_page <= pages) {
          _loadPage(local, local_link);
        } else {
          clearInterval(t);
        }
      }
    }, time_gap);
  }

  var load = function() {
    _load(city, city_link, all_page);
  }

  return {
    load: load
  }
})()

exports.loadHotel = function(req, res) {
  FetchHotel.load();
  res.send({
    success: true
  })
}

