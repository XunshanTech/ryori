var Segment = require('segment');

//分词
exports.doSeg = function(question) {
  var segment = new Segment();
  segment
    .use('URLTokenizer')            // URL识别
    .use('WildcardTokenizer')       // 通配符，必须在标点符号识别之前
    .use('PunctuationTokenizer')    // 标点符号识别
    //.use('ForeignTokenizer')        // 外文字符、数字识别，必须在标点符号识别之后
    // 中文单词识别
    .use('DictTokenizer')           // 词典识别
    .use('ChsNameTokenizer')        // 人名识别，建议在词典识别之后

    // 优化模块
    .use('EmailOptimizer')          // 邮箱地址识别
    .use('ChsNameOptimizer')        // 人名识别优化
    .use('DictOptimizer')           // 词典识别优化
    .use('DatetimeOptimizer')       // 日期时间识别优化
    .loadDict('../../../config/dicts/all_city.txt')
    .loadDict('../../../config/dicts/city.txt')
    .loadDict('../../../config/dicts/dish.txt')
    .loadDict('../../../config/dicts/dish_error_name.txt')
    .loadDict('../../../config/dicts/paper.txt');
  // 字典文件
  /*
   segment
   .useDefault()
   .loadDict('../../../config/dicts/dish.txt');
   */
  return segment.doSegment(question);
}

exports.getDishSeg = function(rets) {
  var r = null;
  rets.forEach(function(ret) {
    if(ret.p && (ret.p === 9 || ret.p === 5)) {
      r = ret;
      return false;
    }
  })
  return r;
}

exports.getPaperSeg = function(rets) {
  var r = null;
  rets.forEach(function(ret) {
    if(ret.p && (ret.p === 13)) {
      r = ret;
      return false;
    }
  })
  return r;
}

exports.getCitySeg = function(rets) {
  var r = null;
  rets.forEach(function(ret) {
    if(ret.p && (ret.p === 7 || ret.p === 11)) {
      ret.isOther = ret.p === 11 && true;
      r = ret;
      return false;
    }
  });
  return r;
}

//判断是否输入“更多”
exports.isMore = function(rets) {
  var flag = false;
  rets.forEach(function(ret) {
    if(ret.w.indexOf('更多') > -1) {
      flag = true;
    }
  })
  return flag;
}
