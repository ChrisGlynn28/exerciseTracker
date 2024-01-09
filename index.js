const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
const bodyParser = require('body-parser');

app.use(cors())
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  description: String,
  duration: Number,
  date: String,
  count: Number,
  log: [{
    description: String,
    duration: Number,
    date: String
  }]
});

let User = mongoose.model('User', userSchema);

const createAndSaveUser = (user, done) => {
  user.save(function(err, data) {
    if (err) return console.error(err);
    done(null, data)
    
  });
};

const getUsers = (done) => { 
  User.find()
  .select('username')
  .exec((err, data) => {
      if(err) return console.log(err);
        done(null,data);
  })
};

const addExercise = (userId, exercise, done) => {
  User.findById(userId, function (err, data) {
    if(err) return console.log(err);
    data.log.push(exercise);
    data.save(function (err, data) {
      if(err) return console.log(err);
      done(null, data)
    })
  })
};

const getUserLogs = (userId, done) => {
 let getUser = User.findById(userId);
   getUser.exec(function(err, data) {
    if(err) return console.log(err);
    done(null, data)
  })
};

app.post('/api/users', (req, res) => {
  let user = new User({username: req.body.username});
  createAndSaveUser(user, function(err, data) {
    if (err) return console.error(err);
    res.json({username: data.username, _id: data._id});
  });
});

app.get('/api/users', (req, res) => {
  getUsers(function(err, data) {
    if (err) return console.error(err);
    res.json(data);
  });
});

app.get('/api/users/:_id/logs', (req, res) => {
  console.log(req.url)
  let filter = {from:new Date(req.query.from), to:new Date(req.query.to), limit:req.query.limit};
  
  getUserLogs(req.params._id, function(err, data) {
    if (err) return console.error(err);

    if(filter.from || filter.to) {
      data.log = data.log
      .filter(item => new Date(item.date) >= filter.from && new Date(item.date) <= filter.to);
    }

    if(filter.limit && filter.limit < data.log.length) {
        data.log = data.log.slice(0, filter.limit);
    }
    
    data.count = data.log.length;
    data.log = data.log
      .map(item => {
      return {
        description: item.description,
        duration: item.duration,
        date: new Date(item.date).toDateString()
      }
    });
    res.json(data);
  });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  let duration = parseInt(req.body.duration);
  let date = new Date(req.body.date);
  if (date == 'Invalid Date') {
    date = new Date();
  }
  addExercise(req.params._id, {description:req.body.description, duration:duration, date:date}, function(err, data) {
    if (err) return console.error(err);
    res.json({_id: data._id, description:req.body.description, username: data.username, date: date.toDateString(), duration: duration
  });
  let user = new User({username: req.body.username});
  createAndSaveUser(user, function(err, data) {
    if (err) return console.error(err);
    res.json({username: data.username, _id: data._id});
  });
});
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
