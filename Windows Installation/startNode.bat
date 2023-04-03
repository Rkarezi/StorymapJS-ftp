@ECHO OFF
TITLE STORYMAP
ECHO StoryMap is booting....

TIMEOUT 5

cd C:\Users\OGH-TS01\Desktop
cd Local Extraction
start /min cmd /C "node index.js"

:loop
	for /f "delims=" %%a in ('
        curl -s -o nul -w "%%{http_code}"  http://localhost:5000
    	') do set "status=%%a"

    	if "%status%"=="404" (
        	echo Server not reachable... trying again...
    	) else if "%status%"=="000" (
        	echo Server offline... trying again...
    	) else (
        	echo Server reachable! SUCCESS!
        	goto :continue
    	)

    	timeout /t 3 /nobreak
    	goto :loop

:continue
	"C:\Program Files\Google\Chrome\Application\chrome.exe" --chrome --kiosk http://localhost:5000
