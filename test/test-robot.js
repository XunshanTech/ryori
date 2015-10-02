require('should');
var map = require('../lib/map');

describe('Map', function() {
  describe('根据输入名返回城市对象：getCityByName', function() {
    it('根据输入的城市名，返回{name:xxx}对象', function() {
      ('北京').should.eql(map.getCityByName('北京市').name);
    });

    it('如果输入的城市在支持列表中，返回的对象带有key字段', function() {
      (2).should.eql(map.getCityByName('北京').key);
    })

    it('如果输入的城市不在支持列表中，返回的对象没有key字段', function() {
      ('undefined').should.eql(typeof(map.getCityByName('锦州').key));
    })
  });

  describe('根据经纬度，返回城市对象：getCityByCoords', function() {
    it('输入北京的经纬度，返回北京对应的城市对象', function(done) {
      map.getCityByCoords(39.941200, 116.503456, function(err, cityObj) {
        ('北京').should.eql(cityObj.name);
        done();
      })
    })
  })
})