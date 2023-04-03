# StorymapJS on a Standalone Device

Utilising the [Storymap Editor](https://storymap.knightlab.com), an extraction from this site is performed onto a web server that retrieves a published.json & the associated images. Standalone devices can access an endpoint on the web server that will return relative map information to be extracted.

This project is divided into two sections,The Public Extraction runs inside a node service that is served on the public network. Whereas, the Local Extraction also runs inside a node service although it is served on a private network (localhost) designed for a NUC running Windows 10.

The public web server interface will allow the functions of adding, deleting, deploying, updating and viewing Storymap versions on the system. Furthermore, the local extraction then shows the deployed map, logs the activity of the user and send error logs back to the webserver.

- [Examples](#examples)
- [Installation](#installation)
- [Deployment](#deployment)
- [How to use](#how-to-use)
- [Having Problems](#having-problems)
- [Thanks](#thanks)

![StoryMapJS Logo](/images/StoryMapJS.png)

# Examples

### Public Extraction - Main interface

![Main Interface](/images/main-inter.png)

### Local Extraction - Main interface

![Storymap](/images/storymap-view.png)

# Installation

### Requirements

- NodeJS v12.20.0 (minimum)
- Mac OS, UNIX-based OS or Windows 7+

### Autobuild (All Operating Systems)

Firstly, for both Public Extraction and Local Extraction `cd ~/<path to extraction folder>` into the source directory.

Clone the repository, `git clone https://github.com/Rkarezi/StorymapJS-ftp.git`

Then, `npm install` to install all dependencies.

### Run

start the node service `npm start`

Public Extraction Endpoint `localhost:2117`

Local Extraction Endpoint `localhost:5000`

### Manually Get Zoomify Basemap

Go to the zoomify folder location, for example: [prod4.sstars.ws](https://prod4.sstars.ws/oxley/zoomify/)

Download the contents in the folder, add them to the `Local Extraction/basemaps/zoomify` or `Public Extraction/basemaps/zoomify`.

# Deployment

### Apache Version 2.4.6 (CentOS Linux v7)

First, install Node JS, `sudo apt-get install nodejs`, this will automatically install npm.

Run `node -v`, check verison is > v12.20.0

#### Older Node Verision

If node version < v12.20.0

1.  `npm cache clean -f`

1.  `npm install -g n`

1.  `sudo n stable`

#### Add Reverse Proxy

Enter in the config file on the server.

Add the following code block to the Virtual Hosts (ports 80 & 443)

```
   ProxyRequests Off
   ProxyPreserveHost On
   ProxyVia Full
   <Proxy *>
      Require all granted
   </Proxy>
   <Location /nodejs>
      ProxyPass http://127.0.0.1:2117
      ProxyPassReverse http://127.0.0.1:2117
   </Location>
```

[Then follow installation instructions](#installation)

## Setting up the NUC (WINDOWS 10 OS)

[Instruction inside Windows Installation Folder](/Windows%20Installation/Installation.md)

# How to use

### Public Web Server Interface

Access the main interface via the endpoint '/'.

#### Add New Map

Enter a unique map name and the share URL given by Storymap JS Editor.

Once entered click the add button.

Then a new map will be added to the table.

### View Map

Clicking the View Map button will open the map version selected.

To return to the main interface, using the browser back button will suffice.

### Deploy Map

A deployed map will be indicated with '(Deployed)' next to the version number. A greyed-out icon indicates that this map version is already deployed. The greyed-out deployed button can be re-clicked to undeploy the map.

Undeployed Maps are displayed by the blue launch icon. Clicking this button will result in that map version being deployed.

### Update Map

Clicking the update map button will check the last modified date of the published.json file stored on the Storymap JS Editor website. If the most recent version is older than then the Storymap JS Editor published.json, a new map version will be created with the new content.

### Delete Map

The delete map button will ask the user to confirm the action.

If the map is the last version on the system and the user deletes it, all of the associated files on the web server will be removed.

### Open Logs

To view the error, update, deletions & deploy logs click the Logs button.

This will open another interface.

![Deploy Options](/images/logs.png)

Selecting a log will open the log inside of the model.

A filter can be selected based on the maps stored in the system.

### Registering and Editing Devices

Initialize the device in the [devices.json](/Public%20Extraction/devices/devices.json) using the format below:

```
   {
      "PCID":"<enter device identification>",
      "mapid":"<enter map id >"
   }
```

Then configure the device with the pcid in the [config.json](/Local%20Extraction/configs/config.json)

# Team

Special thanks to;

Michael Arcuri

Joshua Chia

Navid Niknezhad

Revan Karezi
