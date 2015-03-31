var mongo = require('mongodb');
var mongoose = require('mongoose');
var crypto = require('crypto-js');
var bcrypt = require('bcrypt');
var passport = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var SALT_WORK_FACTOR = 10;

mongoose.connect('localhost','meddb');
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function callback() {
    console.log('Connected to Users');
});

var userSchema = mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true},
});

userSchema.pre('save', function(next){
  // TODO - Add ability to switch betwen MD5 & BCrypt for password storage

  var user = this;

  if(!user.isModified('password')) return next();

  // usage of md5 for password storage
  // TODO - Add MD5 storage
  // TODO - Add Error Handling
  //user.password = crypto.MD5(user.password).toString();
  //next();
  // catch (ex)
  // next(ex);

  // usage of bcrypt for password storage
  bcrypt.genSalt(SALT_WORK_FACTOR, function(err, salt) {
    if(err) return next(err);

    bcrypt.hash(user.password, salt, function(err, hash) {
      if(err) return next(err);
      user.password = hash;
      next();
    });
  });
});

userSchema.methods.comparePassword = function(candidatePassword, cb) {
    // TODO - Add ability to switch betwen MD5 & BCrypt for password storage

    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if(err) return cb(err);
        cb(null, isMatch);
    });
};

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function (err, user) {
    done(err, user);
  });
});

var User = mongoose.model('User', userSchema);

passport.use(new LocalStrategy(function(username, password, done) {
  User.findOne({ username: username }, function(err, user) {
    if (err) { return done(err); }
    if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
    user.comparePassword(password, function(err, isMatch) {
      if (err) return done(err);
      if(isMatch) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Invalid password' });
      }
    });
  });
}));

// TODO - Externalize in Grunt:build with direct db calls
exports.dbBuild = function(req,res){
  populateDB();
  res.send(200);
};

// TODO - Externalize in Grunt:build with direct db calls
exports.dbBuildMD5 = function(req,res){
  populateDBMD5();
  res.send(200);
};

exports.findAll = function(req,res){
  res.send({ user: req.user });
};

exports.login = function(req, res, next) {
  passport.authenticate('local', function(err, user, info) {
    if (err) { return next(err); }
    if (!user) {
      req.session.messages =  [info.message];
      return res.redirect('/#login');
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      return res.redirect('/#meds');
    });
  })(req, res, next);
};

exports.ensureAuth = function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) { return next(); }
  res.redirect('/#login');
};

/*--------------------------------------------------------------------------------------------------------------------*/
// Populate database with sample data -- Only used once: the first time the application is started.
// You'd typically not find this code in a real-life app, since the database would already exist.
var populateDB = function() {
    var user = new User({ username: 'ktoler', email: 'ktoler@ktoler.com', password: 'slapdabass'});
    user.save(function(err){
        if(err){
            console.log(err);
        } else {
            console.log('user: ' + user.username + ' saved.');
        }
    });

    var user2 = new User({ username: 'bob', email: 'bob@bob.com', password: 'nobass'});
    user2.save(function(err){
        if(err){
            console.log(err);
        } else {
            console.log('user: ' + user.username + ' saved.');
        }
    });

};

var populateDBMD5 = function() {
    var user = new User({ username: 'gellerb', email: 'gellerb@domain.com', password: 'coffee'});
    user.save(function(err) {
      if(err) {
            console.log(err);
        } else {
            console.log('user: ' + user.username + ' saved.');
        }
    });
}
