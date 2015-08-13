
/**
 * Module dependencies.
 */

var mongoose = require('mongoose');
var utils = require('../../lib/utils');
var extend = require('util')._extend;
var async = require('async');
var http = require("http");
var phantomCheerio = require('phantom-cheerio')();
var FetchRestaurant = mongoose.model('FetchRestaurant');


var _saveToDb = function(param) {
  FetchRestaurant.findByLink(param.dp_link, function(err, fetchRestaurant) {
    if(!fetchRestaurant) {
      fetchRestaurant = new FetchRestaurant(param);
      fetchRestaurant.save(function(err) {
        console.log(err || 'Save ' + param.name + ' ' + param.local_name);
      })
    }
  })
}

var _loadShop = function(shop_link, city, isEnd) {
  isLoadingShop = true;
  city = city || 0;
  FetchRestaurant.findByLink(shop_link, function(err, fetchRestaurant) {
    if(!fetchRestaurant) {
      phantomCheerio.open(dp + shop_link, function($) {
        var param = {
          dp_link: shop_link,
          city: city,
          dishes: []
        };
        var name = $('.shop-name').contents()[0];
        name = $(name).text().trim();
        var local_name = '';
        if(name.indexOf('(') > -1 && name.indexOf(')') > -1) {
          local_name = name.substring(name.indexOf('(') + 1, name.indexOf(')')).trim();
          name = name.substring(0, name.indexOf('(')).trim();;
        }
        param.name = name;
        param.local_name = local_name;

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
          } else if(text.indexOf('名：') > -1) {
            var other_name = $(this).next('.item').text().trim();
            param.other_name = other_name;
          }
        })

        $('.recommend-name a.item').each(function() {
          var dish_name = $(this).attr('title').trim();
          var dish_score = $(this).find('em.count').text().replace('(', '').replace(')', '').trim();
          param.dishes.push({
            name: dish_name,
            score: dish_score
          })
        })

        console.log(shop_no + ': ' + param.name + ' ' + param.local_name);

        shop_no++;
        isLoadingShop = false;
        if(isEnd) {
          isLoadingPage = false;
          index_page++;
        }

        _saveToDb(param);
      })
    } else {
      shop_no++;
      isLoadingShop = false;
      if(isEnd) {
        isLoadingPage = false;
        index_page++;
      }
    }
  });
}

var _loadPage = function(local, local_link, isOther) {
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

  if(isOther) {
    //境外餐厅 包括香港等
    phantomCheerio.open(dp + local_link + 'p' + index_page, function ($) {
      var shops = $('li.shopname a.BL');
      __eachLoad(shops, $);
    })
  } else {
    //国内城市餐厅
    phantomCheerio.open(dp + search + local_link + 'p' + index_page, function ($) {
      var shops = $('#shop-all-list li .tit a');
      __eachLoad(shops, $);
    })
  }
}

var _load = function(local, local_link, pages, isOther) {
  var t = setInterval(function() {
    if(!isLoadingPage) {
      if(index_page <= pages) {
        _loadPage(local, local_link, isOther);
      } else {
        clearInterval(t);
      }
    }
  }, time_gap);
}

var dp = 'http://www.dianping.com';
var search = '/search/category'
var isLoadingShop = false;
var isLoadingPage = false;
var shop_no = 1;
var time_gap = 3000;

var index_page = 2;
var isOther = true; //是否为境外餐厅

exports.test = function(req, res) {
  //北京
  var bj = 2;
  var bj_link = '/' + bj + '/10/g113';
  //上海
  var sh = 1;
  var sh_link = '/' + sh + '/10/g113';
  //广州
  var gz = 4;
  var gz_link = '/' + gz + '/10/g113';
  //深圳
  var sz = 7;
  var sz_link = '/' + sz + '/10/g113';
  //大连
  var dl = 19;
  var dl_link = '/' + dl + '/10/g113';
  //天津
  var tj = 10;
  var tj_link = '/' + tj + '/10/g113';
  //沈阳
  var sy = 18;
  var sy_link = '/' + sy + '/10/g224';
  //青岛
  var qd = 21;
  var qd_link = '/' + qd + '/10/g113';
  //杭州
  var hz = 3;
  var hz_link = '/' + hz + '/10/g113';
  //香港
  var xg = 'hongkong';
  var xg_link = '/' + xg + '/food/g113';
  //_load(xg, xg_link, 50, isOther);
}