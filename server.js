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

app.get('/', function (req, res) {
  res.sendfile(__dirname + '/index.html');
});

app.listen(5309);

// SOCKET.IO

for (f in config.files) {
  file = config.files[f];
  file.tail = require('child_process').spawn('tail',['-F',file.filename]);
  file.tail.stdout.on('data', function(data) {
    console.log('stdout activity');
    console.log(file);
    if (file.markup) {
      data = file.markup(data);
    }
    for (u in users) {
      if (users[u].socket) {
        users[u].socket.emit('message',{file:f,message:data.toString('utf-8')});
      }
    }
  });
}

io.set('authorization', function(data, accept) {
  if (!data.headers.cookie) {
    return accept('No cookie transmitted.', false);
  }

  data.session_id = connect.utils.parseCookie(data.headers.cookie)['express.sid'];
  session_store.get(data.session_id, function(err, session) {
    if (err || !session) {
      return accept('Error', false);
    }
    data.session = session;
    return accept(null, true);
  });
});

io.sockets.on('connection', function(socket) {
  console.log('connection established?');
  var user = users[socket.handshake.session.user_id];
  user.socket = socket;
  var files = [];
  for (f in config.files) {
    files.push({display_name: config.files[f].display_name, filename: config.files[f].filename});
  }
  socket.emit('init',{files: files});
  socket.on('follow',function(file) {
    user.following[file] = true;
    console.log(data);
  });
  socket.on('unfollow',function(file) {
    user.following[file] = false;
    console.log(data);
  });
});

console.log('Running.');

module.exports = app;


