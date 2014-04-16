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

function sendFile(file, eventID) {
    if (file != '') {
        var uri = "/user/video/" + eventID;
        var xhr = new XMLHttpRequest();
        var fd = new FormData();
        
        xhr.open("POST", uri, true);
        xhr.onreadystatechange = function() {
            if (xhr.readyState == 4 && xhr.status == 200) {
                // Handle response.
                //alert(xhr.responseText); // handle response.
            }
        };
        fd.append('video', file);
        // Initiate a multipart/form-data upload
        xhr.send(fd);
    }
}

// Load the API and make an API call.  Display the results on the screen.
function makeApiCall() {
    // setup form for setting start and end datetime
 // Step 4: Load the Google+ API
     gapi.client.load('calendar', 'v3', function () {
            var calendar_identifier = 'short.term.amnesia.reminder@gmail.com';
            $("button#add_new_event").click(function () {
                var summary = $("#event_title").val();
                var start_datestring = $("#start_date").val() + "T" + $("#start_hours").val() + ":" + $("#start_minutes").val() + ":00.000-04:00";
                var end_datestring = $("#end_date").val() + "T" + $("#end_hours").val() + ":" + $("#end_minutes").val() + ":00.000-04:00";
                var start_datetime = new Date(start_datestring);
                var end_datetime = new Date(end_datestring);
                var request = gapi.client.calendar.events.insert({
                    calendarId: calendar_identifier,
                    'resource': {
                        'summary': summary,
                        'start': {
                           'dateTime': start_datetime.toISOString()
                        },
                        'end': {
                           'dateTime': end_datetime.toISOString()
                        }
                    }
                });  
                request.execute(function (res) {
                    console.log(res);
                    var eventID = res.id;
                    if ($("input#video_file").get(0).files[0] && eventID != null) {
                        sendFile($("input#video_file").get(0).files[0],eventID);
                    }
                    var iframe = document.getElementById('gcal_frame');
                    iframe.src = iframe.src; // refresh
                });
            });
     });
}

$(document).ready(function () {
    initialize_nav("button#nurse");
});
