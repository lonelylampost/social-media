const express = require("express");
const path = require("path");
const bcrypt = require('bcryptjs')
const session = require("express-session");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const mongoose = require("mongoose");
const methodOverride = require('method-override')
const Schema = mongoose.Schema;
const bodyParser = require("body-parser");

require('dotenv').config()

const mongoDb = (process.env.MONGO_URI)
let GB_ID = (process.env.GB_ID)
let PORT = (process.env.PORT)

mongoose.connect(mongoDb, { useUnifiedTopology: true, useNewUrlParser: true });
const db = mongoose.connection;
db.on("error", console.error.bind(console, "mongo connection error"));


const User = mongoose.model(
  "User",
  new Schema({
    username: { type: String, unique: true, required: true },
    password: { type: String, required: true },
    gamesList: { type: Array, required: true }
  })
);

const UserPost = mongoose.model(
  "UserPost",
  new Schema({
    username: { type: String, unique: true, required: true },
    content: { type: String, required: true },
    game: { type: String, required: true },
    gameID: { type: String, required: true },
    date: {type: String, required: true },
    likes: { type: Array, required: true },
    comments: {type: Array, required: true },
    rating: {type: Number, required: false }
  })
);

const UserNote = mongoose.model(
  "UserNotes",
  new Schema({
    username:{ type: String, required: true },
    content: { type: String, required: true },
    game: { type: String, required: false },
    gameID: { type: String, required: false },
    date: {type: String, required: true },
    image: { type: String, required: false }
  })
);


const app = express();
app.set("views", "./views");
app.set("view engine", "ejs");

app.use(session({ secret: "cats", resave: false, saveUninitialized: true }));

app.use(express.static('./src')) 



passport.use(
  new LocalStrategy((username, password, done) => {
    User.findOne({ username: username }, (err, user) => {
      if (err) { 
        return done(err);
      }
      if (!user) {
        return done(null, false, { message: "Invalid username!" });
      } else {
        bcrypt.compare(password, user.password, (err, res) => {
          if (res) {
            return done(null, user)
          } else {
            return done(null, false, { message: "Invalid password!" })
          }
        })
      }
    });
  })
);

passport.serializeUser(function(user, done) {
  done(null, user.id);
});
  
passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

app.use(function(req, res, next) {
  res.locals.currentUser = req.user;
  next();
});



app.use(passport.initialize());
app.use(passport.session());
app.use(express.urlencoded({ extended: false }));


app.get("/", (req, res) => {
    if (req.user) {
      res.redirect('/profile')
    }
    res.render( "index", { user: req.user });
  });

app.get("/sign-up", (req, res) => res.render("signup"));

app.get("/profile", (req, res) => {
  let filteredNotes
  if (req.user === undefined) {
    res.redirect("/");
  } else {
  UserNote.find({username : req.user.username})
  .sort({date: -1})
  .exec(function (err, filteredNotesRes) {
    if (err) {
      console.log(err)
      return res.status(404).send('Server error!')
    }
    if (filteredNotesRes.length === 0) {
      filteredNotesRes = null
    }
    filteredNotes = filteredNotesRes
  })
  UserPost.find({username : req.user.username})
  .sort({date: -1})
  .exec(function (err, filteredcomments) {
    if (err) {
      console.log(err)
      return res.status(404).send('Server error!')
    }
    if (filteredcomments.length === 0) {
      filteredcomments = null
    }
    return res.render("profile", { user: req.user, gameComments: filteredcomments, gameNotes: filteredNotes})
  })}
})

app.get("/game", (req, res) => {
  res.redirect("/gamesearch")
});

app.get("/game/:selectedGameID", (req, res) => {
  let { selectedGameID } = req.params
  let url = `https://www.giantbomb.com/api/game/${Object.values(req.params)[0]}/?api_key=${GB_ID}&format=json`
  function loadJSON(url) {
    fetch(url)
    .then(
      function(response) {
        response.json().then(function(data) {
          let myGame = data.results
          if (!myGame) {
            return res.status(404).send('No game matches that ID!')
          } else {
            UserPost.find({gameID : myGame.guid})
            .sort({date: -1})
            .exec(function (err, filteredcomments) {
              if (err) {
                return next(err);
              }
              return res.render("game", { game: myGame, gameComments: filteredcomments, user: req.user})
            });
          }
        });
      }
    )
    .catch(function(err) {
      console.log('Fetch Error :-S', err);
    });
  }
  loadJSON(url,'jsonp')
})

app.post('/game/:selectedGameID', async (req, res, next) => {
  let currentDate = new Date().toLocaleDateString()
  let rating =[]
  console.log(req.body.gameinput)
  for (let i = 0; i < 5; i++) {
    if (req.body.check) {
      if (req.body.check[i]) {
        rating.push(i)
      }
    }
  }
  if (!req.user) {
    res.redirect("/");
  } else {
  const newPost = await new UserPost({
    username: req.user.username,
    content: req.body.content,
    date: currentDate, 
    game: req.body.gameinput,
    gameID: req.body.gameinputID,
    likes: 0,
    comments: 0,
    rating: rating.length
  }).save(err => {
    if (err) { 
      return next(err);
    }
  res.redirect("/profile");
  })}
})

app.get("/gamesearch", async (req, res) => {
  let searchMatches = []
  let userSearch = req.query.userinput
  function loadJSON(url) {
    fetch(url)
    .then(
      function(response) {
        response.json().then(function(data) {
          for (let i = 0; i < data.results.length; i++) {
            searchMatches.push(data.results[i])
          }
          res.render("gamesearch", {searchMatches: searchMatches})
        });
      }

    )
    .catch(function(err) {
      console.log('Fetch Error :-S', err);
    })}
    if (req.query.userinput) {
      let url = `http://www.giantbomb.com/api/search/?api_key=${GB_ID}&format=json&query="${userSearch}"&resources=game&limit=2`
      await loadJSON(url,'jsonp')
    } else {
      res.render("gamesearch", {searchMatches: []})
    }

})

app.post('/profile', async (req, res, next) => {
  let currentDate = new Date().toLocaleDateString()
  const newNote = await new UserNote({
    username: req.user.username, 
    content: req.body.content,
    date: currentDate,
    game: req.body.gameinput,
    gameID: 0,
  }).save(err => {
    if (err) { 
      return next(err);
    }
  res.redirect("/profile");
  });
})

app.post("/sign-up", async (req, res, next) => {
    const passEncrypt = await bcrypt.hash(req.body.password, 10)
    const user = await new User({
      username: req.body.username,
      password: passEncrypt,
      gamesList: []
    }).save(err => {
      if (err) { 
        return next(err)
      }
      res.redirect("/profile")
    });
  });

app.post("/log-in",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/"
  })
);

app.get("/log-out", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

app.get("/profile/:id", (req, res) => {
  res.redirect("/profile")
});





app.use(methodOverride());

app.post("/profile/:newid", async (req, res) => {
  let currentDate = new Date().toLocaleDateString()
  if (req.body.gametype === 'comment') {
    let rating = []
    for (let i = 0; i < 5; i++) {
      if (req.body.check) {
        if (req.body.check[i]) {
          rating.push(i)
        }
      }
    }
    UserPost.findByIdAndUpdate(req.params.newid, 
      {username : req.user.username,
      content: req.body.content,
      date: currentDate, 
      rating: rating.length }, 
      function(err) {
        if (err) console.log(err);
      })
  } else {
    UserNote.findByIdAndUpdate(req.params.newid, 
      {username : req.user.username,
      content: req.body.content,
      date: currentDate }, 
      function(err) {
        if (err) console.log(err);
      })
  }
  return res.redirect("/profile");
})

app.post("/profile/delete/:id", (req, res) => {
   if (req.body.gameinput === "comment") {
    UserPost.findByIdAndDelete(req.params.id, function (err) {
      if (err) console.log(err);
    })
  } else {
    UserNote.findByIdAndDelete(req.params.id, function (err) {
      if (err) console.log(err);
    });
  }
  return res.redirect('/profile')
})

app.listen(PORT, () => console.log("app running!"));