
/*!
 * Module dependencies.
 */

// Note: We can require users, articles and other cotrollers because we have
// set the NODE_PATH to be ./app/controllers (package.json # scripts # start)

var home = require('home');
var users = require('users');
var articles = require('articles');
var admin = require('admin');
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

  // home route
  app.get('/', home.index);

  // admin routes
  app.all('/super*', auth.user.hasSuperAdminAuthorization);
  app.get('/super', admin.superIndex);
  app.get('/super/admin', admin.getAdmins);

  app.get('/super/article', admin.getArticles);
  app.put('/super/article/:articleId', admin.updateArticle);

  app.get('/super/user', admin.getUsers);
  app.put('/super/user/:userId', admin.updateUser);

  app.get('/super/restaurant', admin.getRestaurants);
  app.post('/super/restaurant', admin.createRestaurant);
  app.get('/super/wxtest', admin.wxtest);
  //app.post('/super/restaurant', admin.createRestaurant);

  app.get('/super/media', admin.getMedias);

  app.get('/super/sendVoice', admin.sendVoice);

  app.get('/super/:superSub', admin.superSub);

  app.all('/admin*', auth.user.hasAdminAuthorization);
  app.get('/admin', admin.index);
  app.get('/admin/article', admin.getArticles);
  app.put('/admin/article/:articleId', admin.updateArticle);

  app.get('/admin/home', admin.home);

  app.param('userId', admin.loadUser);
  app.param('articleId', admin.loadArticle);

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