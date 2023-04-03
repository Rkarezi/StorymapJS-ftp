const express = require("express");
const upload = require("express-fileupload");
const util = require("util");
const axios = require("axios");
var cors = require("cors");
var filesys = require(__dirname + "/filesystem.js");

const app = express();
const { resolve } = require("path");

app.use("/storymaps", express.static(__dirname + "/storymaps"));
app.use("/logs", express.static(__dirname + "/logs"));
app.use("/static", express.static(__dirname + "/static"));
app.use("/basemaps", express.static(__dirname + "/basemaps"));

app.use(upload());
app.use(cors());

var isunDeployed;

app.get("/", (req, res) => {
  if (isunDeployed) {
    res.sendFile(__dirname + "/public/error.html");
  } else {
    res.sendFile(__dirname + "/public/main.html");
  }
});

var servermap = "";
var localmap = "";
var serverversion;
var localversion;
var mapname = "Update";
const timer = 30000;
const webserverurl = "http://localhost:2117/";
// const webserverurl = "https://ps2117.cdms.westernsydney.edu.au/";
const configFile = __dirname + "/configs/version.json";

function startupCheck() {
  console.log("Update Check Started");
  filesys
    .readFile(__dirname + "/configs/config.json")
    .then((mps) => {
      var mapobj = JSON.parse(mps);
      var pcid = mapobj.pcid;
      axios
        .get(webserverurl + "checkforupdate?pcid=" + pcid)
        .then((response) => {
          console.log("Sent PCID to Web Server");
          servermap = response.data.map;

          serverversion = response.data.version;

          if (serverversion == -1) {
            console.log("No Deployed Version");
            var vertoup1 = '{"map":"none", "version":' + serverversion + "}";
            Promise.all([
              filesys.writeFile(configFile, vertoup1),
              filesys.emptyFolder(__dirname + "/storymaps/content"),
              filesys.sendlogs(),
            ])
              .then(() => {
                isunDeployed = true;
                console.log("Files Removed and Logs sent to server");
              })
              .catch((err) => {
                filesys.errorHandler(mapname, err);
              });
          } else {
            filesys
              .readFile(configFile)
              .then((con) => {
                var loc = JSON.parse(con);
                localversion = loc.version;
                localmap = loc.map;
                if (serverversion == localversion && servermap == localmap) {
                  console.log("No new version available");
                  filesys
                    .sendlogs()
                    .then(() => {
                      console.log("Logs sent to Web Server");
                    })
                    .catch((err) => {
                      filesys.errorHandler(mapname, err);
                    });
                } else {
                  console.log("A New Map Version is Available");
                  filesys
                    .getWebServerContent(servermap, serverversion)
                    .then(() => {
                      filesys
                        .cleanup(servermap, serverversion)
                        .then(() => {
                          filesys
                            .transferTempFiles()
                            .then(() => {
                              filesys
                                .removeFile(__dirname + "/storymaps/temp")
                                .then(() => {
                                  filesys
                                    .sendlogs()
                                    .then(() => {
                                      console.log("Logs Files sent to server");
                                    })
                                    .catch((err) => {
                                      filesys.errorHandler(mapname, err);
                                    });
                                })
                                .catch((err) => {
                                  filesys.errorHandler(mapname, err);
                                });
                            })
                            .catch((err) => {
                              filesys.errorHandler(mapname, err);
                            });
                        })
                        .catch((err) => {
                          filesys.errorHandler(mapname, err);
                        });
                    })
                    .catch((err) => {
                      filesys.errorHandler(mapname, err).then(() => {
                        if (err.errno == -3008) {
                          console.log("Lost Internet Connection");
                          setTimeout(() => {
                            startupCheck();
                          }, timer);
                        }
                      });
                    });
                }
              })
              .catch((err) => {
                filesys.errorHandler(mapname, err);
              });
          }
        })
        .catch((err) => {
          if (err.errno == -3008) {
            console.log("No Internet");
            setTimeout(() => {
              startupCheck();
            }, timer);
          } else {
            filesys.errorHandler(mapname, err);
          }
        });
    })
    .catch((err) => {
      filesys.errorHandler(mapname, err);
    });
}

startupCheck();

app.get("/activity", (req, res) => {
  if (req.query.log) {
    filesys
      .appendFile(__dirname + "/logs/activity.log", "\n" + req.query.log)
      .then(() => {
        res.send("Activity is Logged");
        console.log("Activity has been logged");
      })
      .catch((err) => {
        res.send(err);
        filesys.errorHandler("Logging Activity", err);
      });
  } else {
    res.send("No Log Information Sent");
  }
});

app.listen(5000);
