
/*!
 * Module dependencies.
 */

// Note: We can require users, articles and other cotrollers because we have
// set the NODE_PATH to be ./app/controllers (package.json # scripts # start)

var home = require('home');
var client = require('client');
var users = require('users');
var articles = require('articles');
var admin = require('admin');
var coupon = require('coupon');
var season = require('season');
var dish = require('dish');
var dishRestaurant = require('dish_restaurant');
var robotLog = require('robot_log');
var gift = require('gift');
var robot = require('robot');
var fetch = require('fetch');
var fetchJapan = require('fetch_japan');
var japanRestaurant = require('japan_restaurant');
var question = require('question');
var order = require('order');
var paper = require('paper');
var wxNew = require('wx_new');
var michelin = require('michelin');
var auth = require('./middlewares/authorization');
var utils = require('../lib/utils');

/**
 * Route middlewares
 */

var articleAuth = [auth.requiresLogin, auth.article.hasAuthorization];
var userAuth = [auth.requiresLogin, auth.user.hasAuthorization];

/**
 * Expose routes
 */

module.exports = function (app, passport, wx_api) {

  app.all('*', function(req, res, next){
    req.wx_api = wx_api;
    next();
  });

  // user routes
  app.get('/login', users.login);
  app.get('/signup', users.signup);
  app.get('/logout', users.logout);

  app.get('/avatar/:email', users.avatar);

  app.post('/users', users.create);
  app.post('/users/session',
    passport.authenticate('local', {
      failureRedirect: '/login',
      failureFlash: 'Invalid email or password.'
    }), users.session);
  app.get('/users/:userEmail', articles.loadHotArticles, users.show);

  app.route('/users/:userEmail/edit').
    get(users.edit).
    put(userAuth, users.update);
  app.get('/toResetPassword', auth.requiresLogin, users.toResetPassword);
  app.put('/toResetPassword', auth.requiresLogin, users.resetPassword);

  app.get('/auth/github',
    passport.authenticate('github', {
      failureRedirect: '/login'
    }), users.signin);
  app.get('/auth/github/callback',
    passport.authenticate('github', {
      failureRedirect: '/login'
    }), users.authCallback);

  app.param('userEmail', users.load);

  // article routes
  app.param('id', articles.load);
  app.get('/articles', articles.loadHotArticles, articles.index);
  app.get('/articles/new', auth.requiresLogin, articles.loadHotArticles, articles.new);
  app.post('/articles', auth.requiresLogin, articles.loadHotArticles, articles.create);
  app.get('/articles/:id', articles.loadHotArticles, articles.show);
  app.get('/articles/:id/edit', articleAuth, articles.loadHotArticles, articles.edit);
  app.put('/articles/:id', articleAuth, articles.update);
  app.delete('/articles/:id', articleAuth, articles.destroy);

  app.get('/articles/categorys/:category', articles.loadHotArticles, articles.index);

  // upload image
  app.route('/images').
    post(auth.requiresLogin, utils.uploadImage).
    put(auth.requiresLogin, utils.uploadImage);

  // crop user image
  app.route('/cropUserImage').
    post(auth.requiresLogin, utils.cropUserImage).
    put(auth.requiresLogin, utils.cropUserImage);

  // admin routes
  app.all('/super*', auth.requiresLogin, auth.user.hasAdminAuthorization);
  app.post('/super*', auth.user.hasSuperAdminAuthorization);
  app.put('/super*', auth.user.hasSuperAdminAuthorization);
  app.get('/super', admin.superIndex);

  app.param('adminId', admin.loadUser);
  app.get('/super/admin', admin.getAdmins);
  app.get('/super/admin/:adminId', admin.getAdmin);
  app.post('/super/admin', admin.createAdmin);
  app.post('/super/admin/:adminId', admin.updateAdmin);
  app.put('/super/admin/:adminId', admin.updateAdmin);

  app.get('/super/data', admin.getData);
  app.get('/super/data/user', admin.getDataUser);
  app.get('/super/data/play', admin.getDataPlay);
  app.get('/super/data/user/detail', admin.getDataUserDetail);
  app.get('/super/data/play/detail', admin.getDataPlayDetail);
  app.get('/super/data/gift', gift.getDataGift);
  app.get('/super/data/gift/detail', gift.getDataGiftDetail);

  app.get('/super/user', admin.getUsers);
  app.put('/super/user/:userId', admin.updateUser);

  app.param('restaurantId', admin.loadRestaurant);
  app.get('/super/restaurant', admin.getRestaurants);
  app.post('/super/restaurant', admin.createRestaurant);
  app.get('/super/restaurant/:restaurantId', admin.getRestaurant);
  app.post('/super/restaurant/:restaurantId', admin.updateRestaurant);
  app.put('/super/restaurant/:restaurantId', admin.updateRestaurant);

  app.get('/super/getLocationFromBaidu', admin.getLocationFromBaidu);

  app.get('/super/wxtest', admin.wxtest);
  app.get('/super/setMenu', admin.setMenu);
  app.get('/super/resaveMedia', admin.resaveMedia);
  app.get('/super/convertVoice', admin.convertVoice);
  app.post('/super/uploadPic', admin.uploadPic);

  app.param('mediaId', admin.loadMedia);
  app.get('/super/media', admin.getMedias);
  app.put('/super/media/:mediaId', admin.updateMedia);
  app.delete('/super/media', admin.deleteMedia);

  app.param('paperId', paper.loadPaper);
  app.get('/super/paper', paper.getPapers);
  app.post('/super/paper/:paperId', paper.updatePaper);
  app.post('/super/paper', paper.updatePaper);

  app.param('couponId', coupon.loadCoupon);
  app.get('/super/coupon', coupon.getCoupons);
  app.get('/super/coupon/group', coupon.getGroup);
  app.post('/super/coupon/group', coupon.postGroup);
  app.post('/super/coupon', coupon.updateCoupons);
  app.get('/super/coupon/:couponId', coupon.getCoupon);
  app.put('/super/coupon/:couponId', coupon.updateCoupons);

  app.post('/super/uploadFoodPic', season.uploadFoodPic);
  app.param('seasonId', season.loadSeason);
  app.get('/super/season', season.getSeasons);
  app.post('/super/season', season.editSeason);
  app.put('/super/season/:seasonId', season.editSeason);
  app.get('/super/season/:seasonId', season.getSeason);

  app.param('foodId', season.loadFood);
  app.get('/super/food', season.getFoods);
  app.post('/super/food', season.editFood);
  app.put('/super/food/:foodId', season.editFood);
  app.get('/super/food/:foodId', season.getFood);

  app.param('dishId', dish.loadDish);
  app.get('/super/dish', dish.getDishs);
  app.post('/super/dish', dish.editDish);
  app.put('/super/dish/:dishId', dish.editDish);
  app.get('/super/dish/:dishId', dish.getDish);
  app.post('/super/uploadDishPic', dish.uploadDishPic);

  app.param('dishRestaurantId', dishRestaurant.loadDishRestaurant);
  app.get('/super/dishRestaurant/:dishId', dishRestaurant.getDishRestaurants);
  app.post('/super/dishRestaurant', dishRestaurant.editDishRestaurant);
  app.post('/super/dishRestaurant/:dishRestaurantId', dishRestaurant.editDishRestaurantOther);

  app.param('questionId', question.loadQuestion);
  app.get('/super/question', question.getQuestions);
  app.post('/super/question', question.editQuestion);
  app.get('/super/question/reset', question.reset);
  app.post('/super/question/:questionId', question.editQuestion);
  app.put('/super/question/:questionId', question.editQuestion);
  app.get('/super/question/:questionId', question.getQuestion);

  app.param('orderId', order.loadOrder);
  app.get('/super/order', order.getOrders);
  app.get('/super/order/:orderId', order.getOrder);
  app.post('/super/order/:orderId', order.editOrder);
  app.put('/super/order/:orderId', order.editOrder);

  app.get('/super/wxNew/reload', wxNew.reload);
  app.get('/super/wxNew', wxNew.getWxNews);
  //app.get('/super/wxNew/shortUrl', wxNew.shortUrl);

  app.param('fetchRestaurantOtherId', dishRestaurant.loadFetchRestaurantOther);
  app.post('/super/fetchRestaurantOther/:fetchRestaurantOtherId', dishRestaurant.updateFetchRestaurantOther);

  app.param('robotLogId', robotLog.loadRobotLog);
  app.get('/super/robotLog', robotLog.getRobotLogs);
  app.post('/super/robotLog/:robotLogId', robotLog.updateRobotLog);

  app.get('/super/fetch', fetch.getFetchRestaurants);

  app.param('japanRestaurantId', japanRestaurant.loadJapanRestaurant);
  app.get('/super/japanRestaurant', japanRestaurant.getJapanRestaurants);
  app.get('/super/japanRestaurant/:japanRestaurantId', japanRestaurant.getJapanRestaurant);
  app.post('/super/japanRestaurant/:japanRestaurantId', japanRestaurant.updateJapanRestaurant);
  app.put('/super/japanRestaurant/:japanRestaurantId', japanRestaurant.updateJapanRestaurant);
  app.post('/super/uploadJapanRestaurantPic', japanRestaurant.uploadJapanRestaurantPic);

  app.get('/season/:seasonId/food/:foodId', season.toViewFood);

  app.post('/super/gift', gift.createGift);

  app.get('/super/sendVoice', admin.sendVoice);

  app.get('/super/:superSub', admin.superSub);

  app.get('/super/tools/removeOldLocation', admin.removeOldLocation);

  app.all('/admin*', auth.requiresLogin, auth.user.hasAdminAuthorization);
  app.get('/admin', admin.index);

  app.param('userId', admin.loadUser);
  app.param('articleId', admin.loadArticle);

  // home route
  app.get('/', home.index);
  app.get('/index2', home.index2);
  app.get('/index3', home.index3);
  app.get('/chef', home.chef);
  app.get('/chefFood', home.chefFood);
  app.get('/plan', home.plan);
  app.get('/flex', home.flex);
  app.get('/getMichilinData', home.getMichilinData);

  app.get('/toLink/:linkId', home.toLink);

  // michelin route
  app.param('michelinId', michelin.loadMichelin);
  app.get('/michelins', michelin.getMichelins);
  app.get('/michelin/:michelinId', michelin.getMichelin);

  //client
  app.get('/client/order', client.order);
  app.post('/client/order', client.createOrder);
  app.get('/client/orderSuccess', client.orderSuccess);
  app.get('/client/showOrder', client.showOrder);

  app.param('fetchRestaurantId', home.loadFetchRestaurant);
  app.get('/dishRestaurant/:dishId/:fetchRestaurantId', home.dishRestaurant);
  app.get('/cityRestaurants/:cityKey/:dishId', home.cityRestaurants);

  app.get('/restaurantPaper/:fetchRestaurantId', home.restaurantPaper);

  //fetch routes
  app.all('/fetch*', auth.requiresLogin, auth.user.hasSuperAdminAuthorization);
  app.get('/fetch/test', fetch.test);
  app.get('/fetch/getGeo', fetch.getGeo);

  //fetch japan
  app.all('/fetchJapan*', auth.requiresLogin, auth.user.hasSuperAdminAuthorization);
  app.get('/fetchJapan/load', fetchJapan.load);
  app.get('/fetchJapan/loadSight', fetchJapan.loadSight);
  app.get('/fetchJapan/loadHotel', fetchJapan.loadHotel);
  app.get('/fetchJapan/loadRestaurantLocation', fetchJapan.loadRestaurantLocation);

  //robot routes
  //app.all('/robot*', auth.requiresLogin, auth.user.hasSuperAdminAuthorization);
  app.get('/robot', robot.index);
  app.post('/robot/segment', robot.segment);

  app.get('/play/:mediaId', home.play);

  /**
   * Error handling
   */

  app.use(function (err, req, res, next) {
    // treat as 404
    if (err.message
      // ~(-1) = 0; // ~(-1) === -(-1) - 1
      // - by applesstt
      && (~err.message.indexOf('not found')
      || (~err.message.indexOf('Cast to ObjectId failed')))) {
      return next();
    }
    console.error(err.stack);
    // error page
    res.status(500).render('500', { error: err.stack });
  });

  // assume 404 since no middleware responded
  app.use(function (req, res, next) {
    if(req.originalUrl.indexOf('/wechat') === 0) {
      next();
    } else {
      res.status(404).render('404', {
        url: req.originalUrl,
        error: 'Not found'
      });
    }
  });
}