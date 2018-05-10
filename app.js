/* TODO:
() refresh token incase of invalid token
() move big and repitable code segments to seperate modules
*/

// =========
// SETUP
// =========

var express = require('express');
var request = require('request'); // "Request" library
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var fs = require('fs'); 
var content_functions = require('./content.js')
var helpers = require('./helpers.js')
var authentication = require('./authentication.js')

// =========
// VARIABLES
// =========

var client_id = 'a338318326fa4c15b672462457f49a9c'; // Your client id
var client_secret = fs.readFileSync("client_secret.txt", "utf8");
var redirect_uri = 'http://localhost:3000/callback'; // Your redirect uri after the login
var stateKey = 'spotify_auth_state';

// =========
// CODE
// =========

/**
 * Retrieves a new access token for the user  
 * @param  {string} refresh_token refresh token to send to spotify API to gain new access token
 * @return {string} a new access token
*/
var refreshAccessToken = function(refresh_token){
    // set form
    var form = {
      url: 'https://accounts.spotify.com/api/token',
      headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
      form: {
        grant_type: 'refresh_token',
        refresh_token: refresh_token
      },
      json: true
    };
  
    request.post(form, function(error, response, body) {
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

  // Define variables 
  var limit, time_range;

  // read query params and set to default if necessary
  req.query.limit ? limit = req.query.limit : limit = 10;
  req.query.time_range ? time_range = req.query.time_range : time_range = "medium_term";

  // get access token and set relevant api url
  var access_token = req.cookies['access_token'],
      api_url = "https://api.spotify.com/v1/me/top/" + req.params.type + "?limit=" + limit + "&time_range=" + time_range; 
  
  // set authentication form
  var options = {
    url : api_url,
    headers: { 'Authorization': 'Bearer ' + access_token },
    json: true
  }

    // GET top tracks/artists
    request.get(options, function(error, response, body) {
      if(!error && response.statusCode == 200){
        // parse only relevant properties from json
        arr_content = content_functions.retrieve_parsed_content(body.items)
        res.send(arr_content);
      }
      else if (statusCode == 401){

      }
      {
        console.log(body.error.message + ":" + response.statusCode);
        res.status(404).send(body);
      }
      });
})

// authorize user in spotify and redirect
app.get('/login', function(req, res) {
    console.log('on login')
    var state = helpers.generateRandomString(16);
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

      // initiate login with code recieved 
      tokens = authentication.initial_auth(code,redirect_uri,client_id,client_secret,function(access_token,refresh_token){

        // save access and refresh tokens as cookies
        res.cookie("access_token", access_token);
        res.cookie("refresh_token",refresh_token);

        // redirect to home page
        res.redirect('/');
      })
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