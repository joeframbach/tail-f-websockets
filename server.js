/**
 * tail -f <filename> over websockets
 */

var express       = require('express')
   ,app           = express.createServer()
   ,connect       = require('express/node_modules/connect')
   ,config        = require('./config')
   ,io            = require('socket.io').listen(app)
   ,fs            = require('fs');

var MemoryStore   = express.session.MemoryStore;
var session_store = new MemoryStore();

// EXPRESS APP

app.configure(function() {
  app.set('views',__dirname+'/views');
  app.use(express.bodyParser());
  app.use(express.static(__dirname + "/public"));
  app.use(express.cookieParser());
  app.use(express.session({
    store: session_store
   ,secret: config.session_secret
   ,key: 'express.sid'}));
});

// AUTHENTICATION

var users = {};

if (config.auth.type == 'github') {
  require('./github_auth').express(app,users);
}
else if (config.auth.type == 'ldap') {
  require('./ldap_auth').express(app,users);
}
else {
  require('./no_auth').express(app,users);
}

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.listen(5309);

// SOCKET.IO

config.files.forEach(function(file) {
  var tail = require('child_process').spawn('tail',['-F',file.filename]);
  tail.stdout.on('data', function(data) {
    data = data.toString('utf-8');
    var lines = data.split("\n");
    lines.forEach(function(line) {
      if (!line)
        return;
      if (file.markup)
        line = file.markup(line);
      for (user_id in users) {
        user = users[user_id];
        if (user.following[file.filename] && user.socket)
          user.socket.emit('message',{file:file,message:line});
      };
    });
  });
});

io.set('authorization', function(data, accept) {
  if (!data.headers.cookie)
    return accept('No cookie transmitted.', false);

  data.session_id = connect.utils.parseCookie(data.headers.cookie)['express.sid'];
  session_store.get(data.session_id, function(err, session) {
    if (err || !session)
      return accept('Error', false);
    data.session = session;
    return accept(null, true);
  });
});

io.sockets.on('connection', function(socket) {
  console.log('connection established?');
  var user = users[socket.handshake.session.user_id];
  user.socket = socket;
  user.following = {};
  socket.emit('init',{files: config.files});
  socket.on('follow',function(filename) {
    user.following[filename] = true;
  });
  socket.on('unfollow',function(filename) {
    user.following[filename] = false;
  });
});

console.log('Running.');

module.exports = app;


