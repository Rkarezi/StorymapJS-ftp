var fs = require('fs-extra');
const { resolve } = require('path');
const axios = require('axios');
const AdmZip = require('adm-zip')

const errorlogFile = __dirname + '/logs/errors.log'
const updatelogFile = __dirname + '/logs/updates.log'
const storymapurl = 'https://uploads.knightlab.com/storymapjs/'
const basemap = "//prod4.sstars.ws/oxley/"

module.exports = {

    readFile: (path) => {
        return new Promise((resolve, reject) => {
            fs.readFile(path, 'utf8', (err, data) => {
                if (err) {
                    return reject(err);
                }
                resolve(data);
            });
        });
    },

    readFolder: (path) => {
        return new Promise((resolve, reject) => {
            fs.readdir(path, (err, files) => {
                if (err) {
                    return reject(err);
                }
                resolve(files);
            });
        });
    },

    writeFile: (dir, body) => {
        return new Promise((resolve, reject) => {
            fs.writeFile(dir, body, (err2) => {
                if (err2) {
                    return reject(err2)
                }
                resolve();
            });
        });
    },

    appendFile: (dir2, body2) => {
        return new Promise((resolve, reject) => {
            fs.appendFile(dir2, body2, (err3) => {
                if (err3) {
                    return reject(err3)
                }
                resolve();
            });
        });
    },

    createFolder: (dir3) => {
        return new Promise((resolve, reject) => {
            fs.ensureDir(dir3, (err4) => {
                if (err4) {
                    return reject(err4)
                }
                resolve();
            });
        });
    },

    createFile: (dir4) => {
        return new Promise((resolve, reject) => {
            fs.ensureFile(dir4, (err8) => {
                if (err8) {
                    return reject(err8)
                }
                resolve();
            })
        })
    },

    copyFolder: (start, finish) => {
        return new Promise((resolve, reject) => {
            fs.copy(start, finish, (err5) => {
                if (err5) {
                    return reject(err5)
                }
                resolve();
            });
        });
    },

    removeFile: (path) => {
        return new Promise((resolve, reject) => {
            fs.remove(path, (err6) => {
                if (err6) {
                    return reject(err6)
                }
                resolve();
            });
        });
    },

    emptyFolder: (path1) => {
        return new Promise((resolve, reject) => {
            fs.emptyDir(path1, (err7) => {
                if (err7) {
                    return reject(err7)
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

        return day + "-" + month + "-" + year + " " + hours + ":" + mins + ":" + secs;
    },

    handleError: (mapname, err) => {
        return new Promise((resolve, reject) => {
            var currDate = module.exports.DateTimeNow();
            var errmsg = '\n' + currDate + ' ' + mapname + ' ' + err;
            module.exports.appendFile(errorlogFile, errmsg)
            .then(() => {
                resolve();
            }).catch((err) => {
                reject(err)
            })
        });
    },

    zipFiles: (mapname, newVersion) => {
        return new Promise((resolve, reject) => {
            var newversdirectory = __dirname + "/storymaps/" + mapname + "/backups/V" + newVersion
            module.exports.readFile(newversdirectory + '/published.min.js')
            .then((pubmin) => {
                //Edit Published.min.js to suit NUC directories
                var removeLine = new RegExp("storymaps/" + mapname + '/', 'g')
                var devjs = pubmin.replace(removeLine, "storymaps/content/")
                module.exports.createFile(newversdirectory + '/device/published.min.js')
                .then(() => {
                    module.exports.writeFile(newversdirectory + '/device/published.min.js', devjs)
                    .then(() => {
                        //Edit HTML to append javascript for activity logger
                        module.exports.readFile(__dirname + "/public/" + mapname + ".html")
                        .then((devhtml) => {
                            var replaceText = "/storymaps/content/published.min.js"
                            
                            var newhtml = devhtml.replace("\\storymaps\\" + mapname + "\\js\\published.min.js" , replaceText)
                            newhtml = newhtml.replace("/storymaps/" + mapname + "/js/published.min.js", replaceText)
                            newhtml = newhtml.replace("startInactivityTimer();","startInactivityTimer();loggingActivity();")
                            
                            var htmspl = newhtml.split("}\n}\n\n</script>")
                            module.exports.readFile(__dirname + "/static/js/injection.js")
                            .then((inject) => {
                                var finalhtml = htmspl[0] + "\n } \n }\n" + inject + "</script>" + htmspl[1]
                                module.exports.createFile(newversdirectory + '/device/main.html')
                                .then(() => {
                                    module.exports.writeFile(newversdirectory + '/device/main.html', finalhtml)
                                    .then(() => {
                                        //Zip folder into the directory
                                        var zip = new AdmZip()
                                        zip.addLocalFolderPromise(newversdirectory + '/device')
                                        .then(() => {
                                            zip.writeZipPromise(newversdirectory + '/device.zip')
                                            .then(() => {
                                                //Remove the old directory used to zip folder
                                                module.exports.removeFile(newversdirectory + '/device')
                                                .then(() => {
                                                    resolve();
                                                }).catch(err => {
                                                    reject(err)
                                                })
                                            }).catch(err => {
                                                reject(err)
                                            })
                                        }).catch(err => {
                                            reject(err)
                                        })
                                    }).catch(err => {
                                        reject(err)
                                    })
                                }).catch(err => {
                                    reject(err)
                                })
                            }).catch(err => {
                                reject(err)
                            })
                        }).catch(err => {
                            reject(err)
                        })
                    }).catch(err => {
                        reject(err)
                    })
                }).catch(err => {
                    reject(err)
                })
            }).catch(err => {
                reject(err)
            })
        });
    },

    filterArray: (array, filter, filler, operator) => {
        var actualFilter = function(value) {
            if (operator == "==") {
                if(value[filler] == filter) {
                    return value;
                }
            } else if (operator == "!=") {
                if(value[filler] != filter) {
                    return value;
                }
            } else if (operator == ">") {
                if(value[filler] > filter) {
                    return value;
                }
            }
        }
        let filtered = array.filter(actualFilter, filter, filler, operator)
        return filtered
    },

    twoFilterArray: (array, filter, filter2, filler, filler2, operator) => {
        var actualFilter = function(value) {
            if (operator == "==") {
                if(value[filler] == filter && value[filler2] == filter2) {
                    return value;
                }
            } else if (operator == "!=") {
                if(!(value[filler] == filter && value[filler2] == filter2)) {
                    return value;
                }
            }
        }
        let filtered = array.filter(actualFilter, filter, filter2, filler, filler2, operator)
        return filtered
    },


    updateCheck: (mapname, mapid, tag) => {
        return new Promise((resolve, reject) => {
            axios.get(storymapurl + mapid + '/' + tag + '/published.json')
            .then(function (response) {
                var lastModified = response.headers["last-modified"];
                module.exports.readFile(__dirname + '/storymaps/' + mapname + '/js/version.json')
                .then(function (response1) {
                    var versionjson = JSON.parse(response1)
                    var serverLastMod = versionjson.LastModified
                    //Compare date strings for retrieved and system stored datetime stamp
                    if (lastModified == serverLastMod) {
                        resolve('No Update')
                    } else {
                        var tempdirectory = __dirname + '/storymaps/' + mapname + '/temp'

                        module.exports.createFolder(tempdirectory)
                        .then(() => {
                            try {
                                //Clean the published.json paths to suit this system and transfer to javascript object
                                var publishjson = JSON.stringify(response.data);
                                var nohttpsurl = storymapurl.replace("https:", "");
                                var removeLine = new RegExp(nohttpsurl + mapid + "/" + tag + "/", 'g');
                                var updateJSON = publishjson.replace(removeLine,"storymaps/" + mapname + "/");
                                var updateJSON2 = updateJSON.replace('http:' + basemap,"basemaps/");
                                updateJSON2 = updateJSON2.replace('https:' + basemap,"basemaps/");
                                var JSONparts = updateJSON2.split("\"slides\":[");
                                var head = JSONparts[0] + "\"slides\":[";
                                var JSONparts2 = JSONparts[1].split("\"overview\"},");
                                var convStr = JSON.parse(head+JSONparts2[1]);
                                var newJSON = "var storymap_json = " + JSON.stringify(convStr);
                                //Build temp directory with published.min.js and images
                                Promise.all([
                                    module.exports.createFile(tempdirectory + '/published.min.js'),
                                    module.exports.createFolder(tempdirectory + '/_images')
                                ]).then(() => {
                                    module.exports.writeFile(tempdirectory + '/published.min.js', newJSON)
                                    .then(() => {
                                        //Create a list of images from the published.min.js
                                        var imgList = [];
                                        var images = newJSON.split(',').filter(element => element.includes("_images/"));
                                        for (var i = 0; i < images.length; i++) {
                                            var ipt = images[i].split("_images/");
                                            var ipt1 = ipt[1].split("\"");
                                            if (imgList.indexOf(ipt1[0])==-1) {
                                                imgList.push(ipt1[0]);
                                            }
                                        }
                                        var promises = [];
                                        //Loop through images and download
                                        for (var x = 0; x < imgList.length; x++) {
                                            var px = new Promise(function(resolve, reject) {
                                                var blobUrl = storymapurl + mapid + "/" + tag + "/_images/" + imgList[x];
                                                axios.get(blobUrl, { responseType: 'arraybuffer' })
                                                .then(image => {
                                                    var fileName = (image.config.url).split("/").pop()
                                                    module.exports.createFile(tempdirectory + '/_images/' + fileName)
                                                    .then(() => {
                                                        module.exports.writeFile(tempdirectory + '/_images/' + fileName, image.data)
                                                        .then(() => {
                                                            resolve();
                                                        }).catch((err) => {
                                                            module.exports.removeFile(tempdirectory)
                                                            .then(() => {
                                                                reject(err)
                                                            })
                                                        }) 
                                                    }).catch((err) => {
                                                        module.exports.removeFile(tempdirectory)
                                                        .then(() => {
                                                            reject(err)
                                                        })
                                                    }) 
                                                }).catch((err) => {
                                                    module.exports.removeFile(tempdirectory)
                                                    .then(() => {
                                                        reject(err)
                                                    })
                                                }) 
                                            })
                                            promises.push(px);
                                        }
                                        Promise.allSettled(promises)
                                        .then(() =>  {
                                            resolve(lastModified)
                                        }).catch((err) => {
                                            module.exports.removeFile(tempdirectory)
                                            .then(() => {
                                                reject(err)
                                            })
                                        }) 
                                    })
                                })
                            } catch (err) {
                                reject(err)
                            }
                        })
                    }
                }).catch((err) => {
                    reject(err)
                })
            }).catch((err) => {
                reject(err)
            })
        })
    },

    lastVersion: (mapname, startversion, version) => {
        return new Promise((resolve, reject) => {
            module.exports.copyFolder(__dirname + "/storymaps/" + mapname + "/backups/V" + startversion + "/version.json", __dirname + "/storymaps/" + mapname + "/js/version.json")
            .then(() => {
                module.exports.readFile(updatelogFile)
                .then(logs => {
                    var dataArray3 = logs.split('\n');
                    var newArray2 = [];
                    //remove lastest version from the update log as if the version never existed
                    for (let p = 0; p < dataArray3.length; p++) {
                        if (!(dataArray3[p].includes(version) && dataArray3[p].includes(mapname))) {
                            newArray2.push(dataArray3[p]);
                        }
                    }
                    var newdata2 = newArray2.join('\n');
                    module.exports.writeFile(updatelogFile, newdata2)
                    .then(() => {
                        resolve()
                    }).catch(err => {
                        reject(err)
                    });
                }).catch(err => {
                    reject(err)
                });
            }).catch(err => {
                reject(err)
            });
        })
    },

    systemRemove: (mapname) => {
        return new Promise((resolve, reject) => {
            var mapjson = __dirname + '/extractor/js/maps.json'
            module.exports.readFile(mapjson)
            .then(result6 => {
                var maps = JSON.parse(result6);
                var newmaps = module.exports.filterArray(maps, mapname, 'name', "!=")
                Promise.all([
                    module.exports.writeFile(mapjson, JSON.stringify(newmaps)),
                    module.exports.removeFile(__dirname + "/storymaps/" + mapname),
                    module.exports.removeFile(__dirname + "/public/" + mapname + '.html')
                ]).then(() => {
                    resolve()
                }).catch(err => {
                    reject(err)
                });
            }).catch(err => {
                reject(err)
            });
        })
    },

    initalDelete: (mapname, sentversion, activm) => {
        return new Promise((resolve, reject) => {
            module.exports.readFile(__dirname + '/storymaps/' + mapname + '/js/version.json')
            .then(fida => {
                versionjson = JSON.parse(fida);
                var version = versionjson.version;
                module.exports.removeFile(__dirname + "/storymaps/" + mapname + "/backups/V" + sentversion)
                .then(() => {
                    module.exports.writeFile(__dirname + '/deploy/js/activemaps.json', JSON.stringify(activm))
                    .then(() => {
                        resolve(version)
                    }).catch((err) => {
                        reject(err)
                    })
                }).catch((err) => {
                    reject(err)
                })
            }).catch((err) => {
                reject(err)
            })
        })
    }
};