var express         = require('express'), 
    passport        = require('passport'),
    LocalStrategy   = require('passport-local').Strategy,
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
        var data = filez.readFileSync('./schema/users.sql', { encoding: 'utf-8' });
        sql.run(data, function (err) {
            console.log(err);
        });
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

    return {
        add_user: add_user,
        get_user: get_user,
        make_hash: make_hash,
        sql: sql
    };
};

var model = new Model();

var app = express();

/* PASSPORT.JS SETUP */

passport.use(new LocalStrategy({
        usernameField: 'username',
        passwordField: 'password'
    },
    function(username, password, done) {
        model.get_user(done, username);
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
    successRedirect: '/user',
    failureRedirect: '/?failed=1'
}));

/* END EXPRESS.JS SETUP */

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
