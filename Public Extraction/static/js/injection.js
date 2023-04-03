var isLogged = false;

function loggingActivity() {

    document.addEventListener('mousemove', function() {
        if(!isLogged) {
            var dateTime = DateTimeNow();
            sendActivity(dateTime + " Mouse Detected");
            isLogged = true;
            timeAgain();
        }
    }); // when mouse is moved

    document.addEventListener('mousedown', function() {
        if(!isLogged) {
            var dateTime = DateTimeNow();
            sendActivity(dateTime + " Left Mouse Button Detected");
            isLogged = true;
            timeAgain();
        }
    }); // when pressing a mouse button over an element

    document.addEventListener('click', function() {
        if(!isLogged) {
            var dateTime = DateTimeNow();
            sendActivity(dateTime + " Click Detected");
            isLogged = true;
            timeAgain();
        }
    }); // when touchpad is clicked

    document.addEventListener('keypress', function() {
        if(!isLogged) {
            var dateTime = DateTimeNow();
            sendActivity(dateTime + " Keyboard Detected");
            isLogged = true;
            timeAgain();
        }
    }); // when keyboard is pressed

    document.addEventListener('scroll', function() {
        if (!isLogged) {
            var dateTime = DateTimeNow();
            sendActivity(dateTime + " Scroll Detected");
            isLogged = true;
            timeAgain();
        }
    }); // when browser is scrolled

    window.addEventListener('touchstart', function() {
        if (!isLogged) {
            var dateTime = DateTimeNow();
            sendActivity(dateTime + " Touch Detected");
            isLogged = true;
            timeAgain();
        }
    }); // when touchscreen is touched

    function timeAgain() {
        let logtimer = setTimeout(function() {
            isLogged = false;
        }, 60000);
    }
    
}

function DateTimeNow() {
    var d = new Date();
    var day = ("0" + d.getDate()).slice(-2);
    var month = ("0" + (d.getMonth() + 1)).slice(-2);
    var year = d.getFullYear();
    var hours = ("0" + d.getHours()).slice(-2);
    var mins = ("0" + d.getMinutes()).slice(-2);
    var secs = ("0" + d.getSeconds()).slice(-2);

    return day + "-" + month + "-" + year + " " + hours + ":" + mins + ":" + secs;
}

function sendActivity(loginfo) {
    let xhttp = new XMLHttpRequest();
    xhttp.onreadystatechange = function() {
    if (this.readyState == 4 && this.status == 200) {
        console.log(this.responseText);
    }
  };
  xhttp.open("GET", "/activity?log=" + loginfo);
  xhttp.send();
}



