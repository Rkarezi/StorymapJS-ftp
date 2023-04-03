# Setting up the NUC (WINDOWS 10 OS)

### Auto login/Disable sleep

Click Start, and then click Run. In the saech bar, type **Regedit.exe**, and then press Enter.

![RunReg](/images/regrun.png)

Locate the `HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon` subkey in the registry.

![Registry Editor](/images/reg.png)

Double-click the **DefaultUserName entry**, type your user name, and then click OK. Double-click the **DefaultPassword** entry, type your password, and then click OK.

If the DefaultPassword value does not exist in the list, it must be added. To add the value, follow these steps:

1. On the Edit menu, click New, and then select `String Value`.

2. Type **DefaultPassword**, and then press Enter.

3. Double-click **DefaultPassword**.

4. In the Edit String dialog, type your password and then click OK.

On the Edit menu, click New, and then point to String Value.

Type **AutoAdminLogon**, and then press Enter.

Double-click **AutoAdminLogon**.

In the Edit String dialog box, type **1** and then click OK.

![Autologonvalue](/images/autologonvalue.png)

Exit Registry Editor and restart the device. The device should log on automatically.

To disable sleep mode for the device, navigate to the settings in windows.

![settings](/images/settings.png)

Select **Sign-in options** on the left column.

Under the **require sign-in** section, select the **Never** option in the drop-tab.

Under **Dynamic lock**, make sure the checkbox is unchecked.

![disablesleep](/images/disablesleep.png)

Adjust Power Settings to set screen saver & power down timers to never.

### Installing Chrome and downloading local files

Open internet explorer and download [**Chrome**](https://www.google.com.au/chrome/?brand=FHFK&gclid=Cj0KCQjwqp-LBhDQARIsAO0a6aLvue3E01Nzy9b3_q1cbplWvo6JkMJKoFWkpARJBbb7kvCwAmDUbygaAk3gEALw_wcB&gclsrc=aw.ds).

![Chrome page](/images/chrome.png)

In the downloads folder in windows explorer and click on **ChromeSetup.exe**. Follow through the installation steps.

Once Chrome is installed, the Chrome shortcut icon will appear on the desktop. Drag the icon onto the taskbar to pin it.

### Downloading contents for the NUC

Visit the repo to download the [Local Extraction](/Local%20Extraction/) contents onto the NUC. These will be the local files for the Storymap contents.

Head to the downloads folder and open up storymap-js-master-Local-Extraction.zip/storymap-js-master-Local-Extraction.

Copy the 'Local Extraction' folder onto the desktop in **C:\Users\OGH-TS01\Desktop**.

Adjust config.json file inside direction '~/configs' and generate a pcid.

### Downloading base map contents

To download the base map contents for the NUC, head to the [Standalone Server](https://prod4.sstars.ws/oxley/zoomify/). Download the corresponding folder to replace it with the local contents of the NUC in `Local Extraction/basemaps/zoomify`.

### Installing Node.js and Express.js

Visit [Nodejs.org](https://nodejs.org) and download the latest version of Node.js for windows.

![Node page](/images/node.png)

In the downloads folder, click on the **node<version number>.msi** file and follow the steps in the installation window.

In the **Destination Folder** step, do not change the directory and just leave it as it is in **Program Files**.

Next, in the **Tools for Native Modules** step, tick the checkbox and continue to the next step.

Once installation is complete, a command prompt window will open up. The prompt will tell you that it will install the native modules for Node.js. Press enter to continue to the next screen, and repeat the same for the next screen.

![StoryMapJS Logo](/images/nodecmd.png)

Command prompt will become blank. Windows Powershell will then ask for permission to allow for changes in the device. Select yes and a powershell window will open up. Press enter to continue with the installation. Leave the powershell window opened until the installation reaches 100%.

![StoryMapJS Logo](/images/nodepwrshll.png)

Open up a new command prompt window. The default directory should be **C:\Users\OGH-TS01**. You will need to change the directory to the Local Extractions folder by typing in **cd desktop\Local Extraction**.

Type in `npm install`. This will download all of the modules for node.js.

![StoryMapJS Logo](/images/npmcmd.png)

### Automatic start up for node.js

In the **Local Extraction** folder, there will be a folder called **Deployment**. Inside there is a **startNode.bat** file. This is a batch script that will run when the NUC is powered on.

On the bottom left of the desktop, click on the windows icon and in the search bar, type in `run`. In the **run** search bar, type in `shell:startup`. This will bring you to a **Startup** folder. Copy the **startNode.bat** file into this folder.

![StoryMapJS Logo](/images/shell.png)

Once the NUC is powered on, or when you click on the batch file, a command prompt window will open stating StoryMap will open in 5 seconds. After 5 seconds, it will open up `localhost:5000` in **Chrome**. StoryMap will be loaded in the browser.

![StoryMap Kiosk](/images/storymap.png)

The broswer will be opened in kiosk mode. This means the browser will be in fullscreen, and the taskbar will be hidden. To close the broswer, on the keyboard press the windows key `⊞`. The taskbar will appear. Right click on the chrome application on the taskbar and select `Close window`.

![Close StoryMap](/images/closeStorymap.png)
