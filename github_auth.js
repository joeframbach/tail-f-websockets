exports.express = (function(app,users) {
  var everyauth = require('everyauth');
  var config = require('./config.js');
  everyauth.debug = true;
  
  everyauth.everymodule
           .findUserById( function (id, callback) {
              callback(null, users[id]);
           });
  everyauth.github
           .appId(config.auth.app_id)
           .appSecret(config.auth.app_secret)
           .scope('user')
           .findOrCreateUser(function (session, access_token, access_token_extra, github_user) {
              var user_promise = this.Promise();

              session.user_id = github_user.id;
  
              if (users[github_user.id]) {
                user_promise.fulfill(users[github_user.id]);
                return user_promise;
              }

              var rejectUser = (function(reason) {
                return user_promise.fail(reason);
              });

              var acceptUser = (function() {
                var user = {
                  id: github_user.id,
                  github: github_user,
                  github_access_token: access_token
                };
                users[github_user.id] = user;
                user_promise.fulfill(user);
                return user_promise;
              });

              if (config.auth.blacklist && config.auth.blacklist.indexOf(github_user.login) != -1)
                return rejectUser('Blacklisted');

              if (config.auth.whitelist && config.auth.blacklist.indexOf(github_user.login) != -1)
                return acceptUser();
  
              if (config.auth.organizations) {
                var org_req = require('https').request({
                  host: 'api.github.com',
                  path: '/user/orgs?access_token=' + access_token,
                  method: 'GET'
                }, function (org_res) {
                  var data = "";
                  org_res.setEncoding('utf8');
                  org_res.on('data', function (chunk) {
                    data += chunk;
                  });
                  org_res.on('end', function () {
                    var orgs = JSON.parse(data);
                      for (org_id in orgs) {
                        if (config.auth.organizations.indexOf(orgs[org_id].login) != -1) {
                          return acceptUser();
                        }
                      }
                      return rejectUser('Not a member.');
                  });
                });
                org_req.end();
              }

              return acceptUser();
            })
           .redirectPath('/');

  app.use(everyauth.middleware());
  app.get('/', function (req, res, next) {
    if (!req.loggedIn) {
      return res.redirect('/auth/github');
    }
    next();
  });
});
