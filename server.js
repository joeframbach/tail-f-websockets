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

var sockets = {};
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
      for (socket_id in sockets) {
        socket = sockets[socket_id];
        if (socket.following[file.filename])
          socket.emit('message',{file:file,message:line});
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
  var user = users[socket.handshake.session.user_id];
  if (!user) {
    console.log("Attempted to get user " + socket.handshake.session.user_id);
    return;
  }

  socket.user = user;
  sockets[socket.id] = socket;
  socket.emit('init',{files: config.files});

  socket.following = {};
  socket.on('follow', function(filename, confirm) {
    socket.following[filename] = true;
    confirm();
  });
  socket.on('unfollow', function(filename, confirm) {
    socket.following[filename] = false;
    confirm();
  });

});

console.log('Running.');

module.exports = app;


