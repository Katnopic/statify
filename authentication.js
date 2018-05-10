var request = require('request');

module.exports = {
    initial_auth: function(code,redirect_uri,client_id,client_secret,response_func){
        // set request details for initial login
        var options = {
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
    
        // POST initial login  
        request.post(options,function(error,response,body){
            if(!error && response.statusCode == 200){
                var access_token = body.access_token,
                    refresh_token = body.refresh_token;
                response_func(access_token,refresh_token)    
            }       
            //TODO:
            // error handeling if request does not suceed
        })
    }
}