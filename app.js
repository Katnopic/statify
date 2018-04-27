// =========
// SETUP
// =========

var express = require('express');
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

// =========
// VARIABLES
// =========

var client_id = 'a338318326fa4c15b672462457f49a9c'; // Your client id
var client_secret = '8ae0cf4870bf487ab8e96c03a0f53d14'; // Your secret
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

// init express add cookie parser and requests log
var app = express();
app.use(cookieParser());
//app.use(logger('dev'));

// set static route
//app.use(express.static("/", __dirname + '/public'))

app.get('/', function(req,res){
  console.log('on root /')
  res.send("Homepage");
})

app.get('/top/:type',function(req,res){

  console.log(req.cookies);

  // get access token
  var access_token = req.cookies['access_token'],
      api_url = "https://api.spotify.com/v1/me/top/" + req.params.type; 
  
  // set auth form
  var options = {
    url : api_url,
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  }

    if(req.params.type == "tracks")
    {
        console.log("this is : " + req.params.type);
        request.get(options, function(error, response, body) {
          // go over songs
          arrsongs = [];
          var songs = body.items;
          songs.forEach(function(song){
            arrsongs.push(song.name);
          })

          res.send(arrsongs);

        });

    }
    if(req.params.type == "artists")
    {
        console.log("this is : " + req.params.type);
        res.send("topartists");
    }
})

// authorize user in spotify and redirect
app.get('/login', function(req, res) {
    console.log('on login')
    var state = generateRandomString(16);
    res.cookie(stateKey, state);

    // your application requests authorization
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

app.get('/callback', function(req, res) {
    console.log("hi im callback");
    // your application requests refresh and access tokens
    // after checking the state parameter
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

      // save auth options to cookie
//      res.cookie("authcode", code);

  //    res.redirect("/");

      request.post(authOptions,function(error,response,body){
        console.log("inside post");
        if(!error && response.statusCode == 200){
          console.log("im in");
          var access_token = body.access_token,
              refresh_token = body.refresh_token;
          
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