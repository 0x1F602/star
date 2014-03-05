var clientId = '859759004572-auh9dpbm5o5lgo1439udju1ddi9lmudp';

//var apiKey = 'AIzaSyB4S3px4qstdZy7OUCixjdaTmqy5_fGsLo';

var scopes = 'https://www.googleapis.com/auth/calendar';

function handleClientLoad() {
 // Step 2: Reference the API key
 //gapi.client.setApiKey(apiKey);
 window.setTimeout(checkAuth,1);
}

function checkAuth() {
 gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: true}, handleAuthResult);
}

function handleAuthResult(authResult) {
 var authorizeButton = document.getElementById('authorize-button');
 if (authResult && !authResult.error) {
   authorizeButton.style.visibility = 'hidden';
   makeApiCall();
 } else {
   authorizeButton.style.visibility = '';
   authorizeButton.onclick = handleAuthClick;
 }
}

function handleAuthClick(event) {
 // Step 3: get authorization to use private data
 gapi.auth.authorize({client_id: clientId, scope: scopes, immediate: false}, handleAuthResult);
 return false;
}

// Load the API and make an API call.  Display the results on the screen.
function makeApiCall() {
 // Step 4: Load the Google+ API
 gapi.client.load('calendar', 'v3', function () {
        var calendar_identifier = 'short.term.amnesia.reminder@gmail.com';
        var start_datetime = new Date();
        var end_datetime = new Date(start_datetime);
        end_datetime.setHours(start_datetime.getHours() + 3); 
        $("button#add_new_event").click(function () {
            var request = gapi.client.calendar.events.insert({
                calendarId: calendar_identifier,
                'resource': { 
                    'start': {
                       'dateTime': start_datetime.toISOString()
                    },
                    'end': {
                       'dateTime': end_datetime.toISOString()
                    }
                }
            });  
            request.execute(function (res) {
                var iframe = document.getElementById('gcal_frame');
                iframe.src = iframe.src; // refresh
            });
        });
 });
 //gapi.client.load('plus', 'v1', function() {
 //  // Step 5: Assemble the API request
 //  var request = gapi.client.plus.people.get({
 //    'userId': 'me'
 //  });
 //  // Step 6: Execute the API request
 //  request.execute(function(resp) {
 //    var heading = document.createElement('h4');
 //    var image = document.createElement('img');
 //    image.src = resp.image.url;
 //    heading.appendChild(image);
 //    heading.appendChild(document.createTextNode(resp.displayName));

 //    document.getElementById('content').appendChild(heading);
 //  });
 //});
}
