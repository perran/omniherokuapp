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
  res.send('Up and running');
});

//PAGE
app.use('/static', express.static(__dirname + '/public'));

//TWEET TWEET TWEET
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
  
  var twitter = new oauth.OAuth(
    'https://api.twitter.com/oauth/request_token',
    'https://api.twitter.com/oauth/access_token',
    'f4hz8XZYR1O7Mb5Uym0uYtIgI', //api key
    'thXIdqKFghI9hueske9OKJ15Wc3pF1bLquRBP8ugPNyZ0kL8EA', //secret api key
    '1.0A',
    null,
    'HMAC-SHA1'
  );

  var articleIds = [];
   
  twitter.get(
    url.format(
	{
      protocol: 'https:',
      hostname: 'api.twitter.com',
      pathname: '/1.1/statuses/user_timeline.json',
      query: query
    }),
    'accesstokennotnecessary',
    'secretaccesstokennotnecessary',
    function(err, data) 
	{
      if (err) 
	  {
        response.jsonp(err);
      } 
	  else 
	  {       
        JSON.parse(data).forEach(function(tweet) 
		{
			var urly = tweet.entities.urls[0].expanded_url.split("/");
			var articleId = urly[urly.length - 1];
			articleIds.push(articleId);
        });

		getArticleData(articleIds, response);
      }
    }
  );
});

function getArticleData(articleIds, response)
{
	var articles = [];
	var articleId;
	var numberOfArticleIds = articleIds.length;
	var requestsDone = 0;
	for(articleId in articleIds)
	{
		https.get("https://s3-eu-west-1.amazonaws.com/omni-public-articles/" + articleIds[articleId] , function(res) 
		{
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

				var title = articleJson.title;	
				var articleText = articleJson.resources[1].text;
				
				var article = {'title':title, 'articleText':articleText};
				
				articles.push(article);
				++requestsDone;
				
				if(requestsDone == numberOfArticleIds)
				{
					setResponses(articles, response);
				}
			});

		}).on('error', function(e) 
		{
			console.error(e);
		});
	}
}

function setResponses(articles, response)
{
	response.jsonp(
	{
	  'statusCode': 200,
	  'articles': articles
	});
}

//TWEET TWEET TWEET

var port = Number(process.env.PORT || 5000);
app.listen(port, function() {
  console.log("Listening on " + port);
});


