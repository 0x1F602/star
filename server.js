var express         = require('express'), 
    passport        = require('passport'),
    GoogleStrategy = require('passport-google').Strategy,
    RedisStore      = require('connect-redis')(express),
    path            = require('path'),
    crypto          = require('crypto'),
    sqlite3         = require('sqlite3'),
    ws              = require('ws');

function Model() {
    var init_tables = function() {
        console.log("Running init_tables");
        var filez = require('fs');
        // Get our schema files and run them on the sqlite3 database
        var schema_files = filez.readdirSync('./schema/');
        for (var i = 0; i < schema_files.length; i++) {
            if (schema_files[i].match(/.sql$/)) {
                var data = filez.readFileSync('./schema/' + schema_files[i], { encoding: 'utf-8' });
                sql.run(data, function (err) {
                    console.log(err);
                });
            }
        }
    };

    var sql = new sqlite3.Database('stark.sqlite3', init_tables);

    var add_user = function (res, username, password) {
        var salt = 'testing4567';
        var q = "INSERT OR FAIL INTO users (username, salt, password, admin) VALUES (?, ?, ?, 0)";
        sql.run(q, [username, salt, make_hash(salt, password)], function (err, param) {
            console.log("param", err);
            if (err != null) {
                res.redirect('/?failed=1');
            }
            else {
                res.redirect('/?failed=0');
            }
        });
    };

    var get_user = function (done, username) {
        var q = "SELECT * FROM users WHERE username = ?";
        console.log(username);
        sql.get(q, [username], function (err, user_record) {
            var user = {
                rowid: user_record.rowid,
                username: user_record.username
            };
            // callback passed from Passport.JS
            done(null, user);
        });
    };

    var make_hash = function(salt, password) {
        return crypto.createHmac('sha1', salt).update(password).digest('hex');
    };

    var connect_to_gcal = function () {

    };

    var add_video = function (event_id, video_file, done) {
        // copy the file to the public video directory
        console.log(event_id, video_file);
        var sql_query = 'INSERT INTO events (event_id, video_file) VALUES (?, ?)';
        // insert the file path and the event id to the database
        sql.run(sql_query, [event_id, video_file], done);
    };
    
    var get_video = function (event_id, done) {
        console.log(event_id);
        var sql_query = 'SELECT * FROM events WHERE event_id = ?';
        sql.get(sql_query, [event_id], done);
    };

    return {
        add_user: add_user,
        get_user: get_user,
        make_hash: make_hash,
        add_video: add_video,
        get_video: get_video,
        sql: sql
    };
};

var model = new Model();

var app = express();

/* PASSPORT.JS SETUP */

passport.use(new GoogleStrategy({
        returnURL: 'http://synergyservers.com:3000/auth/google/return',
        realm: 'http://synergyservers.com:3000/'
    },
    function (identifier, profile, done) {
        var user = {
            identifier: identifier,
            profile: profile
        };
        done(null, user);
    }
));

passport.serializeUser(function(user, done) {
    console.log("Serializing");
    console.log(user);
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    console.log("Deserializing");
    done(null, user);
});

/* END PASSPORT.JS SETUP */

/* EXPRESS.JS SETUP */

app.set('view engine', 'jade');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.cookieParser());
app.use(express.bodyParser());
app.use(express.session({ 
  secret: "y0urR4nd0mT0k3n", 
  store: new RedisStore(),
  cookie : {
    maxAge : 604800 // one week
  }
}));

app.use(passport.initialize());
app.post('/login', passport.authenticate('local', {
    successRedirect: '/patient',
    failureRedirect: '/?failed=1'
}));

/* END EXPRESS.JS SETUP */

/* UTILITY FUNCTIONS */

function copyFile(source, target, cb) {
  var cbCalled = false;

  var rd = fs.createReadStream(source);
  rd.on("error", function(err) {
    done(err);
  });
  var wr = fs.createWriteStream(target);
  wr.on("error", function(err) {
    done(err);
  });
  wr.on("close", function(ex) {
    done();
  });
  rd.pipe(wr);

  function done(err) {
    if (!cbCalled) {
      cb(err);
      cbCalled = true;
    }
  }
}

/* END UTILITY FUNCTIONS */

/* GoogleStrategy ROUTES */
app.get('/auth/google', passport.authenticate('google'));
app.get('/auth/google/return', 
    passport.authenticate('google', { successRedirect: '/user',
                                        failureRedirect: '/' }));
/* END GoogleStrategy ROUTES */

app.post('/register', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    model.add_user(res, username, password);
});

app.get('/admin', function (req, res) {

});

app.get('/', function (req, res) {
   console.log("User arrived at login page"); 
   console.log(req.query.failed);
   res.render('index', { 'failed': req.query.failed });
});

app.get('/user', ensureAuthenticated, function (req, res) {
    res.render('user', {
        username: req.session.passport.user.username
    });
});

app.get('/patient', ensureAuthenticated, function (req, res) {
    res.render('patient');
});

app.get('/reports', ensureAuthenticated, function (req, res) {
    res.render('reports');
});


app.get('/user/video/:eventid', ensureAuthenticated, function (req, res) {
    // retrieve the file path in the public video directory from the database using the event id
    var event_id = req.params.eventid;
    model.get_video(event_id, function (err, row) {
        var default_video = '/video/x.mp4';
        if (row != undefined) {
            res.send(row.video_file);
        }
        else {
            res.send(default_video); 
        }
    });
});


app.post('/user/video/:eventid', ensureAuthenticated, function (req, res) {
    if (req.files.video != undefined) {
        // from here we need to get the file and the event ID
        var tmp_file_path = req.files.video.path;
        var event_id = req.params.eventid;

        var filez = require('fs');
        var path = require('path');

        var tmp_extension = path.extname(tmp_file_path);
        var perm_path = '/video/' + event_id + tmp_extension;

        var rd = filez.createReadStream(tmp_file_path);
        var wr = filez.createWriteStream('./public' + perm_path);

        rd.pipe(wr);
        model.add_video(event_id, perm_path, function (err) {
            console.log(err);
            res.send('');
        }); 
    }
    else {
        model.add_video(event_id, undefined, function (err) {
            res.send('');
        });
    }
});

function ensureAuthenticated (req, res, next) {
    if (req.session.passport.user) {
        console.log("Authenticated user " + req.session.passport.user.username);
        next();
    }
    else {
        console.log("Not authenticated");
        res.redirect('/');
    }
}

app.use(function (err, req, res, next) {
    console.error(err.stack);
    res.send(500, '500 - ISE');
});

app.listen(3000);
console.log('Listening on port 3000');
