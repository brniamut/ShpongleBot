var querystring = require('querystring');
var request = require('request');
var moment = require('moment');


var baseUrl = 'https://api.telegram.org';
var token = '117706723:AAFHONlmgL5KxNaQ6RxEsETaxz5clvUD1hA';


var offset = 0;

function buildUrl(methodName){
	return baseUrl + '/bot' + token + '/' + methodName;
}

function buildParameters(data){
	return querystring.stringify(data);
}

function makeRequest(url, callback){
	 console.log('[ATTEMPT] Making a requst with url: ' + url);
	request(url, function (error, response, body) {
		
		if(error){
			 console.log('[ERROR] request could not be made: ' + error);
		} else {
			 console.log('[SUCCESS] Data was returned: ' + body);

		 	callback(JSON.parse(body));
		}
	
	});
}

function executeMethod(methodName, parameters, callback){
	var url = buildUrl(methodName);
	url += parameters ?  '?' + buildParameters(parameters) : '';
	
	makeRequest(url, function(data){
		callback(data);
	});
}


function listenForUpdates(){
	 console.log('[ATTEMPT] Polling data')
	executeMethod('getUpdates', {offset: offset}, function(data){
		if(data.ok){
			if(data.result.length > 0){
				offset = data.result[data.result.length - 1].update_id + 1;
			}	
			
			for (var i = 0; i < data.result.length; i++) {
				var message = data.result[i].message;
				processMessage(message);
			};

		} else {
			 console.log('[ERROR] Messages could not be read');
		}
	});
}

//first of all let's see if the bot is online
executeMethod('getMe', undefined, function(data){
	 console.log(data);
	if(data.ok){
		startListening(5000);	
	}
});

//Let's start listening to updates
function startListening(time){
	setInterval(listenForUpdates, time);
}

function sendMessage(chat_id, text) {
	executeMethod('sendMessage', {chat_id: chat_id, text: text}, function(data){
		console.log(data);
	});
}


function processMessage(message){
	var chat_id = message.chat.id;
	var senderFirstName = message.from.first_name;
	var messageText = message.text;

	returnMessage = "Hey " + senderFirstName + ", ";

	switch (messageText) {
		case '/canweshpongle':
		case 'canweshpongle':
			canWeShpongle(function(endMessage){
				sendMessage(chat_id, returnMessage + endMessage);
			});
		break;
	}


}



//alle opties
function canWeShpongle(callback) {
	request('http://api.openweathermap.org/data/2.5/forecast/daily?q=Amsterdam&mode=json&units=metric&cnt=7APPID=92d1b4e81aca1acb06bb5631ea6f5400', function (error, response, body) {
  		var endMessage = '';

  		if (!error && response.statusCode == 200) {
  			var data = [];

    		var result = JSON.parse(body);
    		result.list.forEach(function(weathermoment) {
    			data.push({
	    			utc: weathermoment.dt,
	    			date: moment(weathermoment.dt, 'X').format('dddd Do MMMM'),
	    			morningTemp: weathermoment.temp.morn, 
	    			afternoonTemp: weathermoment.temp.day,
	    			eveningTemp: weathermoment.temp.eve,
	    			weather: weathermoment.weather,
	    			reasons: []
    			});
    		});	
  		



  			data.forEach(function(moment){
  				if(moment.morningTemp < 18 || moment.afternoonTemp < 22 || moment.eveningTemp < 18) {
  					moment.shpongleToday = false;
  					moment.reasons.push('It\'s too cold (morning, afternoon, evening temperature) ' + '(' + moment.morningTemp + '°, ' + moment.afternoonTemp + '°, ' + moment.eveningTemp + '°)');
  				}

  				moment.weather.forEach(function(weatherType){
  					if(weatherType.main === 'Rain'){
  						moment.shpongleToday = false;
  						moment.reasons.push('It\'s gonna rain');
  					}
  				});
			});


  			endMessage += 'I generated a Shpongele Report for you... \n\n';
			data.forEach(function(moment){
				endMessage += 'Date: ' + moment.date + '\n';
				endMessage += 'Can we shpongle outside? ' + (moment.shpongleToday ? 'Hell Yeah!': 'No') + '\n';
				if(!moment.shpongleToday) {
					endMessage += 'Why not? \n'
					moment.reasons.forEach(function(reason){
					endMessage += "- " + reason + '\n';
				});

				}
			
				endMessage += ' \n';	

			});
			endMessage += 'Feel free to ask me for another report tommorow. I have more accurate data by then. Remember you can always shpongle at kokopelli!'
			callback(endMessage);
  		} else {
  			console.log(error);
  		}
	});
}






