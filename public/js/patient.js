var clientId = '859759004572-auh9dpbm5o5lgo1439udju1ddi9lmudp';

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

function sendFile(file) {
    if (file != '') {
        var uri = "/upload";
        var xhr = new XMLHttpRequest();
        var fd = new FormData();
        
        xhr.open("POST", uri, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
                // Handle response.
                alert(xhr.responseText); // handle response.
            }
        };
        fd.append('video', file);
        // Initiate a multipart/form-data upload
        xhr.send(fd);
    }
}


// Load the API and make an API call.  Display the results on the screen.
function makeApiCall() {
 // Step 4: Load the Google+ API
     gapi.client.load('calendar', 'v3', function () {
            var calendar_identifier = 'short.term.amnesia.reminder@gmail.com';
            var finished_tasks_identifier = 'e3q8p8d89p8412rua87td57po0@group.calendar.google.com';
            var latest_event_identifier = '';
            
            function get_latest_event() {
                var start_datetime = new Date();
                var max_datetime = new Date(start_datetime);
                max_datetime.setMinutes(max_datetime.getMinutes() + 1);
                var request = gapi.client.calendar.events.list({
                    calendarId: calendar_identifier,
                    timeMin: start_datetime,
                    timeMax: max_datetime,
                    orderBy: 'startTime',
                    singleEvents: true
                });
                request.execute(function (res) {
                    var events = res.items;
                    if (events) {
                        var start = new Date(events[0].start.dateTime);
                        var end = new Date(events[0].end.dateTime);
                        console.log(events);
                        latest_event_identifier = events[0].id;
                        $("h1#current_title").html(events[0].summary);
                        $("h2#start_time").html("Start " + start.toLocaleTimeString("en-US"));
                        $("h2#end_time").html("End " + end.toLocaleTimeString("en-US"));
                        $("#latest_event").show();
                    }
                    else {
                        $("h3#alerts").html("No events found.");
                    }
                });
            }
    
            get_latest_event();
            // setup click handler here for completed etc
            $("button#completed").click(function () {
                if (latest_event_identifier != '') {
                    var req_body = {
                        calendarId: calendar_identifier,
                        eventId: latest_event_identifier,
                        destination: finished_tasks_identifier
                    };
                    console.log(req_body);
                    var request = gapi.client.calendar.events.move(req_body);
                    request.execute(function (res) {
                        $("#latest_event").hide();
                        get_latest_event(); 
                    });
                }
            });
     });
}

$(document).ready(function () {
    setInterval(function () {
        var now = new Date();
        $("h4#current_time").html("Current time: " + now.toLocaleDateString("en-US") + " " + now.toLocaleTimeString("en-US"));
    }, 2000);
    $("#latest_event").hide();
});
