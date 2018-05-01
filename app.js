// =========
// SETUP
// =========

var express = require('express');
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fs = require('fs');

// =========
// VARIABLES
// =========

/* ==== TODO
1) merge artists and tracks query to one function?
2) refresh token incase of invalid token
*/
var client_id = 'a338318326fa4c15b672462457f49a9c'; // Your client id
var client_secret = fs.readFileSync("client_secret.txt", "utf8");
console.log(client_secret);
var redirect_uri = 'http://localhost:3000/callback'; // Your redirect uri after the login
var stateKey = 'spotify_auth_state';

// =========
// CODE
// =========

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
*/
var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  };

var refreshAccessToken = function(refresh_token){
    // set form
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
      form: {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      },
      json: true
    };
  
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        return body.access_token;
      }
      else{
        return "error getting access token";
      }
      
    });
}

// init express add cookie parser and requests log
var app = express();
app.use(cookieParser());
//app.use(logger('dev'));

// set static route
//app.use(express.static("/", __dirname + '/public'))

app.get('/', function(req,res){
  console.log('on root')
  res.send("Homepage");
})

app.get('/top/:type',function(req,res){

  // set default query params 
  var limit = 10,
      time_range = "medium_term";

  // read query params and change default
  req.query.limit ? limit = req.query.limit : null;
  req.query.time_range ? time_range = req.query.time_range : null;

  // get access token and set relevant api url
  var access_token = req.cookies['access_token'],
      api_url = "https://api.spotify.com/v1/me/top/" + req.params.type + "?limit=" + limit + "&time_range=" + time_range; 
  
  // set authentication form
  var options = {
    url : api_url,
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  }

  // if user requested top tracks
  if(req.params.type == "tracks")
  {
      request.get(options, function(error, response, body) {
        // go over songs
        if(!error && response.statusCode == 200){
          arrsongs = [];
          var songs = body.items;
          songs.forEach(function(song){
            arrsongs.push(song.name);
          })

          res.send(arrsongs);
        }
        else
        {
          console.log(error + ":" + response.statusCode);
          res.status(404).send(body);
        }
      });

    }
  if(req.params.type == "artists")
  {
      if(!error && response.statusCode == 200){
        arrartists = [];
        var artists = body.items;
        artists.forEach(function(artist){
          arrartists.push(artist.name);
        })

        res.send(arrartists);
      }
      else
      {
        res.status(404).send(body);     
      }
    }
})

// authorize user in spotify and redirect
app.get('/login', function(req, res) {
    console.log('on login')
    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    // request authorization ; redirects to /callback
    var scope = 'user-read-private user-read-email user-top-read';
    res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
    response_type: 'code',
    client_id: client_id,
    scope: scope,
    redirect_uri: redirect_uri,
    state: state
    }));
});

// after user accepted login
app.get('/callback', function(req, res) {
    console.log("on callback");
    var code = req.query.code || null;
    var state = req.query.state || null;
    var storedState = req.cookies ? req.cookies[stateKey] : null;

    if (state === null || state !== storedState) {
      console.log('mismatch');
      res.redirect('/#' +
        querystring.stringify({
          error: 'state_mismatch'
        }));
    } else {
      res.clearCookie(stateKey);
          
      var authOptions = {
        url: 'https://accounts.spotify.com/api/token',
        form: {
          code: code,
          redirect_uri: redirect_uri,
          grant_type: 'authorization_code'
        },
        headers: {
          'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
        },
        json: true
      };

      request.post(authOptions,function(error,response,body){
        console.log("on post");
        if(!error && response.statusCode == 200){
          console.log("setting access token");
          var access_token = body.access_token,
              refresh_token = body.refresh_token;
          
          // save request and access tokens as cookies
          res.cookie("access_token", access_token);
          res.cookie("refresh_token",refresh_token);
          res.redirect('/');
          
            }
          });

      //res.redirect('/');
/*
          var options = {
            url : api_url,
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true
          }
  
          request.get(options, function(error, response, body) {
            // go over songs
            var songs = body.items;
            songs.forEach(function(song){
              console.log(song.name)
            })
  
          });
  
        }
      })

*/


/*
      request.post(authOptions, function(error, response, body) {
        if (!error && response.statusCode === 200) {
  
          var access_token = body.access_token,
              refresh_token = body.refresh_token,
              api_url = 'https://api.spotify.com/v1/me';
  
          var options = {
            url: 'https://api.spotify.com/v1/me',
            headers: { 'Authorization': 'Bearer ' + access_token },
            json: true
          };
  
          // use the access token to access the Spotify Web API
          request.get(options, function(error, response, body) {
            //console.log(body);
          });
  
          // we can also pass the token to the browser to make requests from there
          res.redirect('/#' +
            querystring.stringify({
              access_token: access_token,
              refresh_token: refresh_token
            }));
        } else {
          res.redirect('/#' +
            querystring.stringify({
              error: 'invalid_token'
            }));
        }
      });
      */
    }

  });
  
  app.get('/refresh_token', function(req, res) {
  
    // requesting access token from refresh token
    var refresh_token = req.query.refresh_token;
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
      form: {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      },
      json: true
    };
  
    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {
        var access_token = body.access_token;
        res.send({
          'access_token': access_token
        });
      }
    });
  });

app.listen("3000",function(){
    console.log("listening on 3000");
})