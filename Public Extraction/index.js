/*
    Written by Group PS2117 - 25/10/2021
*/

const express = require("express");
const upload = require("express-fileupload");
var filesys = require(__dirname + "/filesystem.js");
const util = require("util");
const axios = require("axios");

var cors = require("cors");
const { resolve } = require("path");
const { json, response } = require("express");
const { readFile, writeFile } = require("fs");
const { zipFiles, lastVersion, systemRemove } = require("./filesystem");

const app = express();

app.use("/storymaps", express.static(__dirname + "/storymaps"));

app.use("/extractor/js", express.static(__dirname + "/extractor/js"));
app.use("/extractor/css", express.static(__dirname + "/extractor/css"));

app.use("/deploy/js", express.static(__dirname + "/deploy/js"));
app.use("/deploy/css", express.static(__dirname + "/deploy/css"));

app.use("/logs", express.static(__dirname + "/logs"));
app.use("/devices", express.static(__dirname + "/devices"));
app.use("/static", express.static(__dirname + "/static"));
app.use("/basemaps", express.static(__dirname + "/basemaps"));

app.use(upload());
app.use(express.json());
app.use(cors());

const updatelogFile = __dirname + "/logs/updates.log";
const deploylogFile = __dirname + "/logs/deploys.log";
const deletelogFile = __dirname + "/logs/deletions.log";
const activemapFile = __dirname + "/deploy/js/activemaps.json";
const mapsFile = __dirname + "/extractor/js/maps.json";
const deviceFile = __dirname + "/devices/devices.json";
const knightslab = "https://uploads.knightlab.com/storymapjs/";

app.get("/maps", (req, res) => {
  res.sendFile(activemapFile);
});

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/main.html");
});

app.get("/viewmap", (req, res) => {
  if (req.query.mapname != "") {
    res.sendFile(__dirname + "/public/" + req.query.mapname + ".html");
  } else {
    res.send("No map in query string");
  }
});

app.get("/checkforupdate", (req, res) => {
  var mapid = "";
  if (req.query.pcid) {
    filesys
      .readFile(deviceFile)
      .then((devs) => {
        var obj = JSON.parse(devs);
        //Check Device is registered on System
        var array = filesys.filterArray(obj, req.query.pcid, "PCID", "==");
        if (array.length == 0) {
          res.send("No device found on the system with the entered id.");
        } else {
          mapid = array[0].mapid;
          if (mapid != null && mapid != "") {
            filesys
              .readFile(mapsFile)
              .then((mps) => {
                var mapname = "";
                var mapobj = JSON.parse(mps);
                //Check if map assigned to device is a valid map on the system.
                var checkmap = filesys.filterArray(mapobj, mapid, "name", "==");
                if (checkmap.length == 0) {
                  var nomap = {
                    map: "none",
                    version: -1,
                  };
                  res.send(nomap);
                } else {
                  mapname = checkmap[0].name;
                  res.sendFile(
                    __dirname + "/storymaps/" + mapname + "/js/deployed.json"
                  );
                }
              })
              .catch((err) => {
                filesys.handleError("updatecheck", err);
                res.send(err);
              });
          } else {
            res.send("Error in retrieving map.");
          }
        }
      })
      .catch((err) => {
        filesys.handleError("updatecheck", err);
        res.send(err);
      });
  } else {
    res.send("No identification was sent.");
  }
});

app.get("/getimages", (req, res) => {
  if (req.query.mapname && req.query.version) {
    res.sendFile(
      __dirname +
        "/storymaps/" +
        req.query.mapname +
        "/backups/V" +
        req.query.version +
        "/device.zip",
      (err) => {
        if (err) {
          filesys.handleError("getDeviceZIP", err);
          res.send(err);
        }
      }
    );
  } else {
    res.send("No information sent through");
  }
});

app.post("/sendlog", (req, res) => {
  if (req.query.pcid) {
    filesys
      .readFile(deviceFile)
      .then((devs) => {
        var obj = JSON.parse(devs);
        //Check a valid device has sent through log files
        var deviceCheck = filesys.filterArray(
          obj,
          req.query.pcid,
          "PCID",
          "=="
        );
        if (deviceCheck.length > 0) {
          filesys
            .createFolder(__dirname + "/devices/" + req.query.pcid)
            .then(() => {
              var errorlog =
                __dirname + "/devices/" + req.query.pcid + "/errors.log";
              var activitylog =
                __dirname + "/devices/" + req.query.pcid + "/activity.log";
              Promise.all([
                filesys.createFile(activitylog),
                filesys.createFile(errorlog),
              ])
                .then(() => {
                  Promise.all([
                    filesys.appendFile(activitylog, "\n" + req.body.actlog),
                    filesys.appendFile(errorlog, "\n" + req.body.errlog),
                  ])
                    .then(() => {
                      res.send("Files Uploaded");
                    })
                    .catch((err) => {
                      filesys.handleError("sendLogs", err);
                      res.send(err);
                    });
                })
                .catch((err) => {
                  filesys.handleError("sendLogs", err);
                  res.send(err);
                });
            })
            .catch((err) => {
              filesys.handleError("sendLogs", err);
              res.send(err);
            });
        } else {
          res.send("Your PCID is invalid");
        }
      })
      .catch((err) => {
        filesys.handleError("sendLogs", err);
        res.send(err);
      });
  } else {
    res.send("Missing log files");
  }
});

app.get("/update", (req, res) => {
  if (req.query.mapname && req.query.mapid && req.query.tag) {
    //Check if the information sent through requires an update of map verisons
    filesys
      .updateCheck(req.query.mapname, req.query.mapid, req.query.tag)
      .then((check) => {
        if (check == "No Update") {
          res.send("No Update");
        } else {
          //updateCheck function return the new last modified datetime stamp
          var mapname = req.query.mapname;
          var mapid = req.query.mapid;
          var maptag = req.query.tag;
          var mapmod = check;
          var currDate = filesys.DateTimeNow();

          var versionFile =
            __dirname + "/storymaps/" + mapname + "/js/version.json";

          filesys
            .readFile(versionFile)
            .then((data) => {
              var obj = JSON.parse(data);
              var version = obj.version;

              //Generate the new version
              var newVersion = parseInt(version) + parseInt("1");

              var logLine =
                "\n" +
                currDate +
                " " +
                mapname +
                " V" +
                newVersion.toString() +
                " Images(Updated) Content(Updated)";

              if (mapmod == null) {
                mapmod = "";
              }

              var newjline = {
                version: newVersion.toString(),
                LastModified: mapmod,
              };

              var newversionfolder =
                __dirname + "/storymaps/" + mapname + "/backups/V" + newVersion;
              var tempfolder = __dirname + "/storymaps/" + mapname + "/temp";

              //Create Backup Folder with new version number
              filesys
                .createFolder(newversionfolder)
                .then(() => {
                  //Update the version file, log the update and copy temp contents into backup folder
                  Promise.all([
                    filesys.writeFile(versionFile, JSON.stringify(newjline)),
                    filesys.appendFile(updatelogFile, logLine),
                    filesys.copyFolder(
                      tempfolder + "/_images",
                      newversionfolder + "/_images"
                    ),
                    filesys.copyFolder(
                      tempfolder + "/published.min.js",
                      newversionfolder + "/published.min.js"
                    ),
                    filesys.createFolder(newversionfolder + "/device"),
                  ])
                    .then(() => {
                      filesys
                        .readFile(activemapFile)
                        .then((result) => {
                          var mapdata = {
                            mapid: mapid + "/" + maptag,
                            name: mapname,
                            version: newVersion,
                            datetime: currDate,
                            deployed: 0,
                          };
                          var mpjs = JSON.parse(result);
                          mpjs.push(mapdata);
                          Promise.all([
                            filesys.copyFolder(
                              versionFile,
                              newversionfolder + "/version.json"
                            ),
                            filesys.writeFile(
                              activemapFile,
                              JSON.stringify(mpjs)
                            ),
                            filesys.copyFolder(
                              newversionfolder + "/_images",
                              newversionfolder + "/device"
                            ),
                          ])
                            .then(() => {
                              //Zip the device folder
                              filesys
                                .zipFiles(mapname, newVersion)
                                .then(() => {
                                  filesys
                                    .removeFile(
                                      __dirname +
                                        "/storymaps/" +
                                        mapname +
                                        "/temp"
                                    )
                                    .then(() => {
                                      res.send("Files Uploaded");
                                    });
                                })
                                .catch((err) => {
                                  filesys.handleError(mapname, err);
                                  res.send(err);
                                });
                            })
                            .catch((err) => {
                              filesys.handleError(mapname, err);
                              res.send(err);
                            });
                        })
                        .catch((err) => {
                          filesys.handleError(mapname, err);
                          res.send(err);
                        });
                    })
                    .catch((err) => {
                      filesys.handleError(mapname, err);
                      res.send(err);
                    });
                })
                .catch((err) => {
                  filesys.handleError(mapname, err);
                  res.send(err);
                });
            })
            .catch((err) => {
              filesys.handleError(mapname, err);
              res.send(err);
            });
        }
      })
      .catch((err) => {
        filesys.handleError(req.query.mapname, err);
        res.send(err);
      });
  } else {
    res.send("Missing Information");
  }
});

app.get("/deployment", (req, res) => {
  let mapname = req.query.mapname;
  let version = req.query.version;

  if (mapname && version) {
    var currDate = filesys.DateTimeNow();
    var depLine = "\n" + currDate + " " + mapname + " V" + version;

    var newjline = '{"map":"' + mapname + '","version":' + version + "}";
    var parjson = JSON.parse(newjline);

    //Update deployed.json file & log the deployment.
    Promise.all([
      filesys.writeFile(
        __dirname + "/storymaps/" + mapname + "/js/deployed.json",
        JSON.stringify(parjson)
      ),
      filesys.appendFile(deploylogFile, depLine),
    ])
      .then(() => {
        filesys
          .readFile(activemapFile)
          .then((result) => {
            var newActiveMaps = [];
            var amp = JSON.parse(result);
            //Loop through activemaps.json and deploy the requested version
            for (var o = 0; o < amp.length; o++) {
              if (amp[o].name == mapname) {
                if (amp[o].version == version) {
                  var newdata = {
                    mapid: amp[o].mapid,
                    name: amp[o].name,
                    version: amp[o].version,
                    datetime: amp[o].datetime,
                    deployed: 1,
                  };
                  newActiveMaps.push(newdata);
                } else {
                  var newdata2 = {
                    mapid: amp[o].mapid,
                    name: amp[o].name,
                    version: amp[o].version,
                    datetime: amp[o].datetime,
                    deployed: 0,
                  };
                  newActiveMaps.push(newdata2);
                }
              } else {
                newActiveMaps.push(amp[o]);
              }
            }
            filesys
              .writeFile(activemapFile, JSON.stringify(newActiveMaps))
              .then(() => {
                res.send("Files Uploaded");
              })
              .catch((err) => {
                filesys.handleError(mapname, err);
                res.send(err);
              });
          })
          .catch((err) => {
            filesys.handleError(mapname, err);
            res.send(err);
          });
      })
      .catch((err) => {
        filesys.handleError(mapname, err);
        res.send(err);
      });
  } else {
    res.send("Incorrect data sent");
  }
});

app.get("/undeploy", (req, res) => {
  if (req.query.mapname) {
    var newDeploy = {
      map: req.query.mapname,
      version: -1,
    };
    filesys
      .writeFile(
        __dirname + "/storymaps/" + req.query.mapname + "/js/deployed.json",
        JSON.stringify(newDeploy)
      )
      .then(() => {
        filesys
          .readFile(activemapFile)
          .then((result) => {
            var newActiveMaps = [];
            var amp = JSON.parse(result);
            //Loop through activemaps.json and undeploy all version with requested the mapname
            for (var o = 0; o < amp.length; o++) {
              if (amp[o].name == req.query.mapname) {
                var newdata = {
                  mapid: amp[o].mapid,
                  name: amp[o].name,
                  version: amp[o].version,
                  datetime: amp[o].datetime,
                  deployed: 0,
                };
                newActiveMaps.push(newdata);
              } else {
                newActiveMaps.push(amp[o]);
              }
            }
            filesys
              .writeFile(activemapFile, JSON.stringify(newActiveMaps))
              .then(() => {
                res.send("Files Uploaded");
              })
              .catch((err) => {
                filesys.handleError(req.query.mapname, err);
                res.send(err);
              });
          })
          .catch((err) => {
            filesys.handleError(req.query.mapname, err);
            res.send(err);
          });
      })
      .catch((err) => {
        filesys.handleError(req.query.mapname, err);
        res.send(err);
      });
  } else {
    res.send("Missing information in query string");
  }
});

app.get("/view", (req, res) => {
  if (req.query.version && req.query.mapname) {
    filesys
      .emptyFolder(__dirname + "/storymaps/" + req.query.mapname + "/_images")
      .then(() => {
        var versionFolder =
          __dirname +
          "/storymaps/" +
          req.query.mapname +
          "/backups/V" +
          req.query.version;
        var mapFolder = __dirname + "/storymaps/" + req.query.mapname;
        Promise.all([
          filesys.copyFolder(
            versionFolder + "/_images",
            mapFolder + "/_images"
          ),
          filesys.copyFolder(
            versionFolder + "/published.min.js",
            mapFolder + "/js/published.min.js"
          ),
        ])
          .then(() => {
            res.send("Files Uploaded");
          })
          .catch((err) => {
            filesys.handleError(req.query.mapname, err);
            res.send(err);
          });
      })
      .catch((err) => {
        filesys.handleError(req.query.mapname, err);
        res.send(err);
      });
  } else {
    res.send("Incorrect data sent");
  }
});

app.get("/delete", (req, res) => {
  if (req.query.version && req.query.mapname) {
    var currDate = filesys.DateTimeNow();
    filesys.readFile(activemapFile).then((rlt) => {
      var actmp = JSON.parse(rlt);
      //Get map that matches requested map name and version
      let newactive = filesys.twoFilterArray(
        actmp,
        req.query.mapname,
        req.query.version,
        "name",
        "version",
        "!="
      );
      //Remove the map version from system
      filesys
        .initalDelete(req.query.mapname, req.query.version, newactive)
        .then((version) => {
          //Check if version is the most recent version on the system
          if (version != req.query.version) {
            var delLine =
              "\n" +
              currDate +
              " " +
              req.query.mapname +
              " V" +
              req.query.version;
            filesys
              .appendFile(deletelogFile, delLine)
              .then(() => {
                res.send("Files Uploaded");
              })
              .catch((err) => {
                filesys.handleError(req.query.mapname, err);
                res.send(err);
              });
          } else {
            //Check if the version is the only one left on the system
            var startversion = 0;
            for (var i = 0; i < newactive.length; i++) {
              if (newactive[i].name == req.query.mapname) {
                if (newactive[i].version > startversion) {
                  startversion = newactive[i].version;
                }
              }
            }
            if (startversion == 0) {
              //Full System removal of map
              filesys
                .systemRemove(req.query.mapname)
                .then(() => {
                  res.send("Files Uploaded");
                })
                .catch((err) => {
                  filesys.handleError(req.query.mapname, err);
                  res.send(err);
                });
            } else {
              filesys
                .lastVersion(req.query.mapname, startversion, req.query.version)
                .then(() => {
                  res.send("Files Uploaded");
                })
                .catch((err) => {
                  filesys.handleError(req.query.mapname, err);
                  res.send(err);
                });
            }
          }
        })
        .catch((err) => {
          filesys.handleError(req.query.mapname, err);
          res.send(err);
        });
    });
  } else {
    res.send("Missing Information");
  }
});

app.get("/new", (req, res) => {
  if (req.query.mapname && req.query.maphash && req.query.maptag) {
    axios
      .get(
        knightslab + req.query.maphash + "/" + req.query.maptag + "/index.html"
      )
      .then(function (response) {
        filesys
          .readFile(__dirname + "/public/generic.html")
          .then(function (response1) {
            //Edit the HTML file to append new javascript
            var top = response.data.split('<meta charset="utf-8">')[0];
            var editbot = response1.split("enter new url here");
            var newHTML =
              top +
              "\n<meta charset='utf-8'>\n" +
              editbot[0] +
              "/storymaps/" +
              req.query.mapname +
              "/js/published.min.js" +
              editbot[1];
            filesys
              .createFile(__dirname + "/public/" + req.query.mapname + ".html")
              .then(() => {
                filesys
                  .writeFile(
                    __dirname + "/public/" + req.query.mapname + ".html",
                    newHTML
                  )
                  .then(() => {
                    filesys
                      .readFile(mapsFile)
                      .then((result) => {
                        var isName,
                          isHash = false;
                        var mapcont = [];
                        var amp = JSON.parse(result);
                        for (var i = 0; i < amp.length; i++) {
                          if (amp[i].name == req.query.mapname) {
                            isName = true;
                          }
                          if (
                            amp[i].id == req.query.maphash &&
                            amp[i].tag == req.query.maptag
                          ) {
                            isHash = true;
                          }
                          mapcont.push(amp[i]);
                        }
                        //Check if any names or id already exists on the system
                        if (isHash || isName) {
                          if (isHash && isName) {
                            res.send(
                              "The Map Name and URL entered already exists on the system!"
                            );
                          } else if (isHash) {
                            res.send(
                              "The Map URL entered already exists on the system!"
                            );
                          } else if (isName) {
                            res.send(
                              "The Map Name entered already exists on the system!"
                            );
                          }
                        } else {
                          var newMap = {
                            name: req.query.mapname,
                            tag: req.query.maptag,
                            id: req.query.maphash,
                          };
                          mapcont.push(newMap);
                          var version = {
                            version: 0,
                            LastModified: "NO DATE",
                          };
                          var deploy = {
                            map: req.query.mapname,
                            version: -1,
                          };
                          //Add new map to the system
                          filesys
                            .writeFile(mapsFile, JSON.stringify(mapcont))
                            .then(() => {
                              var mapdirectory =
                                __dirname + "/storymaps/" + req.query.mapname;
                              filesys
                                .createFolder(mapdirectory)
                                .then(() => {
                                  Promise.all([
                                    filesys.createFolder(
                                      mapdirectory + "/_images"
                                    ),
                                    filesys.createFolder(mapdirectory + "/js"),
                                    filesys.createFolder(
                                      mapdirectory + "/backups"
                                    ),
                                    filesys.createFile(
                                      mapdirectory + "/js/version.json"
                                    ),
                                    filesys.createFile(
                                      mapdirectory + "/js/deployed.json"
                                    ),
                                  ])
                                    .then(() => {
                                      Promise.all([
                                        filesys.writeFile(
                                          mapdirectory + "/js/deployed.json",
                                          JSON.stringify(deploy)
                                        ),
                                        filesys.writeFile(
                                          mapdirectory + "/js/version.json",
                                          JSON.stringify(version)
                                        ),
                                      ]).then(() => {
                                        res.send("Files Uploaded");
                                      });
                                    })
                                    .catch((err) => {
                                      filesys.handleError(
                                        req.query.mapname,
                                        err
                                      );
                                      res.send(err);
                                    });
                                })
                                .catch((err) => {
                                  filesys.handleError(req.query.mapname, err);
                                  res.send(err);
                                });
                            })
                            .catch((err) => {
                              filesys.handleError(req.query.mapname, err);
                              res.send(err);
                            });
                        }
                      })
                      .catch((err) => {
                        filesys.handleError(req.query.mapname, err);
                        res.send(err);
                      });
                  })
                  .catch((err) => {
                    filesys.handleError(req.query.mapname, err);
                    res.send(err);
                  });
              })
              .catch((err) => {
                filesys.handleError(req.query.mapname, err);
                res.send(err);
              });
          })
          .catch((err) => {
            filesys.handleError(req.query.mapname, err);
            res.send(err);
          });
      })
      .catch(() => {
        res.send("Your map is not found on the StorymapJS website.");
      });
  } else {
    res.send("The appropiate data was not sent through!");
  }
});

app.listen(2117);
