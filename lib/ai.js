var aiml = require('./aiml');

var filenames = [
  'config/aimls/alice.aiml',
  'config/aimls/question.aiml',
  'config/aimls/dish.aiml'
];

exports.reply = function(words, cb) {
  aiml.parseFiles(filenames, function(err, topics){
    var engine = new aiml.AiEngine('Default', topics, {name: '李栈栈', sex: '男', old: '1'});
    var wordsAry = [];
    words.forEach(function(word) {
      wordsAry.push(word.w);
    })

    engine.reply({name: 'You'}, wordsAry.join(' '), function(err, aimlResult){
      cb(err, aimlResult);
    });
  });
}
