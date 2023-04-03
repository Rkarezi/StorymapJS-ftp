var fs = require("fs-extra");
const axios = require("axios");
var AdmZip = require("adm-zip");
const webserverurl = "http://localhost:2117/";
const configFile = __dirname + "/configs/config.json";
const errorLog = __dirname + "/logs/errors.log";
const activityLog = __dirname + "/logs/activity.log";
const tempDirectory = __dirname + "/storymaps/temp";

module.exports = {
  readFile: (path) => {
    return new Promise((resolve, reject) => {
      fs.readFile(path, "utf8", (err, data) => {
        if (err) {
          return reject(err);
        }
        resolve(data);
      });
    });
  },

  writeFile: (dir, body) => {
    return new Promise((resolve, reject) => {
      fs.writeFile(dir, body, (err2) => {
        if (err2) {
          return reject(err2);
        }
        resolve();
      });
    });
  },

  appendFile: (dir2, body2) => {
    return new Promise((resolve, reject) => {
      fs.appendFile(dir2, body2, (err3) => {
        if (err3) {
          return reject(err3);
        }
        resolve();
      });
    });
  },

  createFolder: (dir3) => {
    return new Promise((resolve, reject) => {
      fs.ensureDir(dir3, (err4) => {
        if (err4) {
          return reject(err4);
        }
        resolve();
      });
    });
  },

  createFile: (dir4) => {
    return new Promise((resolve, reject) => {
      fs.ensureFile(dir4, (err8) => {
        if (err8) {
          return reject(err8);
        }
        resolve();
      });
    });
  },

  copyFolder: (start, finish) => {
    return new Promise((resolve, reject) => {
      fs.copy(start, finish, (err5) => {
        if (err5) {
          return reject(err5);
        }
        resolve();
      });
    });
  },

  removeFile: (path) => {
    return new Promise((resolve, reject) => {
      fs.remove(path, (err6) => {
        if (err6) {
          return reject(err6);
        }
        resolve();
      });
    });
  },

  emptyFolder: (path1) => {
    return new Promise((resolve, reject) => {
      fs.emptyDir(path1, (err7) => {
        if (err7) {
          return reject(err7);
        }
        resolve();
      });
    });
  },

  DateTimeNow: () => {
    var d = new Date();
    var day = ("0" + d.getDate()).slice(-2);
    var month = ("0" + (d.getMonth() + 1)).slice(-2);
    var year = d.getFullYear();
    var hours = ("0" + d.getHours()).slice(-2);
    var mins = ("0" + d.getMinutes()).slice(-2);
    var secs = ("0" + d.getSeconds()).slice(-2);

    return (
      day + "-" + month + "-" + year + " " + hours + ":" + mins + ":" + secs
    );
  },

  errorHandler: (mapname, err) => {
    return new Promise((resolve, reject) => {
      var currDate = module.exports.DateTimeNow();
      var errmsg = "\n" + currDate + " " + mapname + " " + err;
      module.exports
        .appendFile(errorLog, errmsg)
        .then(() => {
          resolve();
        })
        .catch(() => {
          reject(err);
        });
    });
  },

  sendlogs: () => {
    return new Promise((resolve, reject) => {
      module.exports
        .readFile(configFile)
        .then((device) => {
          var dev = JSON.parse(device);
          var pcid = dev.pcid;
          module.exports
            .readFile(activityLog)
            .then((activs) => {
              module.exports
                .readFile(errorLog)
                .then((errors) => {
                  //POST logs to the web server
                  axios
                    .post(webserverurl + "sendlog?pcid=" + pcid, {
                      errlog: errors,
                      actlog: activs,
                    })
                    .then((response) => {
                      if (response.data == "Files Uploaded") {
                        Promise.all([
                          module.exports.writeFile(activityLog, ""),
                          module.exports.writeFile(errorLog, ""),
                        ])
                          .then(() => {
                            resolve();
                          })
                          .catch((err) => {
                            reject(err);
                          });
                      }
                    })
                    .catch((err) => {
                      reject(err);
                    });
                })
                .catch((err) => {
                  reject(err);
                });
            })
            .catch((err) => {
              reject(err);
            });
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  cleanup: (servermap, serverversion) => {
    return new Promise((resolve, reject) => {
      var vertoup =
        '{"map":"' + servermap + '","version":' + serverversion + "}";
      Promise.all([
        module.exports.emptyFolder(__dirname + "/storymaps/content"),
        module.exports.removeFile(__dirname + "/public/main.html"),
        module.exports.writeFile(__dirname + "/configs/version.json", vertoup),
      ])
        .then(() => {
          resolve();
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  transferTempFiles: () => {
    return new Promise((resolve, reject) => {
      Promise.all([
        module.exports.copyFolder(
          tempDirectory + "/published.min.js",
          __dirname + "/storymaps/content/published.min.js"
        ),
        module.exports.copyFolder(
          tempDirectory + "/main.html",
          __dirname + "/public/main.html"
        ),
      ])
        .then(() => {
          Promise.all([
            module.exports.removeFile(tempDirectory + "/published.min.js"),
            module.exports.removeFile(tempDirectory + "/main.html"),
          ])
            .then(() => {
              module.exports
                .copyFolder(
                  tempDirectory,
                  __dirname + "/storymaps/content/_images"
                )
                .then(() => {
                  resolve();
                })
                .catch((err) => {
                  reject(err);
                });
            })
            .catch((err) => {
              reject(err);
            });
        })
        .catch((err) => {
          reject(err);
        });
    });
  },

  getWebServerContent: (mapname, mapversion) => {
    return new Promise((resolve, reject) => {
      module.exports
        .createFolder(tempDirectory)
        .then(() => {
          //Get the zipped folder from the web server
          axios
            .get(
              webserverurl +
                "getimages?mapname=" +
                mapname +
                "&version=" +
                mapversion,
              { responseType: "arraybuffer" }
            )
            .then((blob) => {
              var zip = new AdmZip(blob.data);
              let extract = new Promise(function (resolve, reject) {
                //extract zip folder
                zip.extractAllToAsync(tempDirectory, true, true, (err) => {
                  if (err) {
                    return reject(err);
                  }
                  resolve();
                });
              });
              extract
                .then(() => {
                  resolve();
                })
                .catch((err) => {
                  reject(err);
                });
            })
            .catch((err) => {
              reject(err);
            });
        })
        .catch((err) => {
          reject(err);
        });
    });
  },
};
