// web.js
var express = require("express");
var logfmt = require("logfmt");
var url = require("url");
var oauth = require("oauth");
var https = require('https');

var app = express();

app.use(logfmt.requestLogger());

app.get('/', function(req, res) 
{
  res.send('Hello World!');
});

//PAGE

app.use('/static', express.static(__dirname + '/public'));


//TWEET TWEET TWEET

  var articles = [];

app.get('/tweetsjson', function(request, response) 
{
  var query = 
  {
    'trim_user': '1',
	'screen_name':'omni_red'
  };

  var count = parseInt(request.param('count'));

  if (!isNaN(count)) 
  {
    query.count = count;
  }

  console.log("query: " + query);
  
  var twitter = new oauth.OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    'f4hz8XZYR1O7Mb5Uym0uYtIgI', //api key
    'thXIdqKFghI9hueske9OKJ15Wc3pF1bLquRBP8ugPNyZ0kL8EA', //secret api key
    '1.0A',
    null,
    'HMAC-SHA1'
  );

  var tweets = [];
  
  var articleIds = [];
  

  
  twitter.get(
    url.format(
	{
      protocol: 'https:',
      hostname: 'api.twitter.com',
      pathname: '/1.1/statuses/user_timeline.json',
      query: query
    }),
    '2435972731-YtCkMs7IOiHUJ2R6PAS1jOmy9no6qyYxnstIETr', //access token
    'grj3KBXutgvPnJ7lPHsfCystqOr6yl9W3L7lpLfQUEqKI',//secret access token
    function(err, data) 
	{
      if (err) 
	  {
        response.jsonp(err);
      } 
	  else 
	  {
        
		//console.log("data: " + data);
        JSON.parse(data).forEach(function(tweet) 
		{
			var urly = tweet.entities.urls[0].expanded_url.split("/");
			var articleId = urly[urly.length - 1];
		
          //tweets.push(
		  //{
            //'id_str': tweet.id_str,
            //'created_at': tweet.created_at,
            //'text': tweet.text,
			//'expanded_url': articleId
          //});
		  articleIds.push(articleId);
		  
        });
		console.log("tweets pushed");
		getArticleData(articleIds, response);
/*
        response.jsonp(
		{
          'statusCode': 200,
          'data': tweets,
		  'article'
        });
		
*/
      }
    }
  );
  
  /*
  
  
  http.get("https://s3-eu-west-1.amazonaws.com/omni-public-articles/86cd198c-479e-4cf1-8a27-6d411b823a48" + tweets[0][expanded_url], 
	  function(res) 
	  {
		console.log("Got response: " + res);
		
		response.jsonp(
		{
          'statusCode': 200,
          'data': tweets,
		  'article': res
        });
		
		
	  }).on('error', function(e) 
	  {
		console.log("Got error: " + e.message);
	  });
*/

  
  
});

function getArticleData(articleIds, response)
{
	
	//var articleUrl = "https://s3-eu-west-1.amazonaws.com/omni-public-articles/" + articleIds[0]
	//console.log("articleUrl: ", articleUrl);
	var articleId;
	for(articleId in articleIds)
	{
		https.get("https://s3-eu-west-1.amazonaws.com/omni-public-articles/" + articleIds[articleId] , function(res) 
		{
			//console.log("statusCode: ", res.statusCode);
			//console.log("headers: ", res.headers);

			
			
			res.on('data', function(d) 
			{	
				try
				{
					var articleJson = JSON.parse(d);
				}
				catch(errore)
				{
					console.log(errore);
				}
				//console.log("articleJson: ", articleJson);
				var title = articleJson.title;	
				var articleText = articleJson.resources[1].text;
				
				var article = {'title':title, 'articleText':articleText};
				
				articles.push(article);
				
				response.jsonp(
				{
				  'statusCode': 200,
				  'articles': articles
				});
				
				console.log("response fixed");
			});

		}).on('error', function(e) 
		{
			console.error(e);
		});
	}
}

//TWEET TWEET TWEET

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});


