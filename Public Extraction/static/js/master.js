
  window.onload = function() {
    axios.get('/deploy/js/activemaps.json')
    .then(function (response) {
        for (var i=0; i < response.data.length; i++) {
            var tby = document.getElementById("tbdy");
            var row = tby.insertRow(0);
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var cell3 = row.insertCell(2);
            var cell4 = row.insertCell(3);
            var cell5 = row.insertCell(4);
            cell1.innerHTML = JSON.stringify(response.data[i].mapid).replace(/"/g, "");
            cell2.innerHTML = JSON.stringify(response.data[i].name).replace(/"/g, "");
            cell3.innerHTML = JSON.stringify(response.data[i].datetime).replace(/"/g, "");
            const myDate = moment(response.data[i].datetime, 'DD-MM-YYYY HH:mm:ss').toDate();
            var dte = myDate.toISOString();
            cell3.setAttribute("data-sort", dte);
            cell4.innerHTML = JSON.stringify(response.data[i].version).replace(/"/g, "");
            if (response.data[i].deployed == 0) {
                cell5.innerHTML = "<input type='image' title='View' onclick='view(this);' value='" + cell4.innerHTML + "<NAME:>" + cell2.innerHTML + "' src='/static/images/view.png' width=25px/><input type='image' title='Deploy' onclick='deploy(this);' value='" + cell4.innerHTML + "<NAME:>" + cell2.innerHTML + "' src='/static/images/deploy.png' width=25px /><input type='image' title='Update' onclick='update(this);' value='" + cell2.innerHTML + "' src='/static/images/update.png' width=25px/><input type='image' title='Delete' onclick='checkdelete(this);' value='" + cell4.innerHTML + "<NAME:>" + cell2.innerHTML + "' src='/static/images/delete.png' width=25px/>";
            } else {
                cell4.innerHTML += " (Deployed)";
                cell5.innerHTML = "<input type='image' title='View' onclick='view(this);' value='" + response.data[i].version + "<NAME:>" + cell2.innerHTML + "' src='/static/images/view.png' width=25px/><input type='image' title='Deploy' onclick='deploycheck(this);' value='" +  cell2.innerHTML + "' src='/static/images/undeployed.png' width=25px /><input type='image' title='Update' onclick='update(this);' value='" + cell2.innerHTML + "' src='/static/images/update.png' width=25px/><input type='image' title='Delete' onclick='checkdelete(this);' value='" + response.data[i].version + "<NAME:>" + cell2.innerHTML + "' src='/static/images/delete.png' width=25px/>";
            }
        }

        $.fn.dataTable.moment( 'DD-MM-YYYY HH:mm:ss' );
        let table = new DataTable('#datatable', {
            select: true,
            searching: true,
            columnDefs: [{ type: 'date', targets: 0 }],
            lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
            scrollY:        "30vh",
            scrollCollapse: true,
            destroy: true
        });
        table.order( [ 1, 'desc' ] ).draw();

        document.getElementById("openlog").style.display = "block";
    });
}

function deploy(button) {
    document.getElementById("mapName").classList.remove("required");
    document.getElementById("mapID").classList.remove("required");
    var butval = button.value;
    var valparts = butval.split("<NAME:>");
    var version = valparts[0];
    var mapname = valparts[1];

    document.getElementById("loadmsg").innerHTML = "Please wait your action is being processed...";
    var locModal = document.getElementById('mymod');
    locModal.style.display = "block";
    locModal.style.paddingRight = "17px";
    locModal.className="modal fade show";

    axios.get('/deployment?mapname=' + mapname + '&version=' + version)
    .then(function (response) {
        if (response.data == "Files Uploaded") {
            setTimeout(function(){
                var locModal = document.getElementById('mymod');
                locModal.style.display = "none";
                locModal.className="modal fade";
                launch_toast('deploy', mapname.charAt(0).toUpperCase()+ mapname.slice(1) + ' map version ' + version + ' has been deployed.', 'Deploy Map');
                refreshTable();
            }, 2200);
        } else {
            var locModal = document.getElementById('mymod');
            locModal.style.display = "none";
            locModal.className="modal fade";

            document.getElementById("errmsg").innerHTML = "Error in deploying map, please view error log.";
            var locModal4 = document.getElementById('errmod');
            locModal4.style.display = "block";
            locModal4.style.paddingRight = "17px";
            locModal4.className="modal fade show";
        }
    });
}

function checkdelete(button) {
    document.getElementById("mapName").classList.remove("required");
    document.getElementById("mapID").classList.remove("required");
    var tableRef = document.getElementById("datatable").getElementsByTagName("tbody")[0];
    var mapcount = 0;
    for (var i = 0; i < tableRef.rows.length; ++i) {
        if (tableRef.rows[i].cells[1].innerHTML == button.value.split("<NAME:>")[1]) {
          mapcount += 1;
        }
    }

    if (mapcount == 1) {
        document.getElementById("delmsg").innerHTML = "This is the last map stored on the system for this id. Are you sure you want to completely remove this map off the system?";
    } else {
        document.getElementById("delmsg").innerHTML = "Are you sure you want to delete this map version?";
    }

    document.getElementById('yesbtn').setAttribute("value",button.value);
    var locModal = document.getElementById('checkmod');
    locModal.style.display = "block";
    locModal.style.paddingRight = "17px";
    locModal.className="modal fade show";
}

function deleted(btnvalue) {
    var locModal1 = document.getElementById('checkmod');
    locModal1.style.display = "none";
    locModal1.className="modal fade";

    var butval = btnvalue.value;
    var valparts = butval.split("<NAME:>");
    var version = valparts[0];
    var mapname = valparts[1];

    document.getElementById("loadmsg").innerHTML = "Please wait your action is being processed...";
    var locModal2 = document.getElementById('mymod');
    locModal2.style.display = "block";
    locModal2.style.paddingRight = "17px";
    locModal2.className="modal fade show";

    axios.get('/delete?mapname=' + mapname + '&version=' + version)
    .then(function (response) {
        if (response.data == "Files Uploaded") {
            setTimeout(function(){
                var locModal = document.getElementById('mymod');
                locModal.style.display = "none";
                locModal.className="modal fade";
                launch_toast('delete', mapname.charAt(0).toUpperCase()+ mapname.slice(1) + ' map version ' + version + ' has been deleted.', "Deleted Map");
                refreshTable();
            }, 2200);
        } else {
            var locModal = document.getElementById('mymod');
            locModal.style.display = "none";
            locModal.className="modal fade";

            document.getElementById("errmsg").innerHTML = "Error in Deletion Process, please view error log.";
            var locModal4 = document.getElementById('errmod');
            locModal4.style.display = "block";
            locModal4.style.paddingRight = "17px";
            locModal4.className="modal fade show";
        }
    });
}

function deploycheck(button) {
    document.getElementById("mapName").classList.remove("required");
    document.getElementById("mapID").classList.remove("required");
    
    document.getElementById('depbtn').setAttribute('value', button.value);
    var locModal = document.getElementById('undep');
    locModal.style.display = "block";
    locModal.style.paddingRight = "17px";
    locModal.className="modal fade show";
}

function undeploy(button) {
    var mapname = button.value;
    undepclose();

    document.getElementById("loadmsg").innerHTML = "Please wait your action is being processed...";
    var locModal2 = document.getElementById('mymod');
    locModal2.style.display = "block";
    locModal2.style.paddingRight = "17px";
    locModal2.className="modal fade show";

    axios.get('/undeploy?mapname=' + mapname)
    .then(function (response) {
        if (response.data == "Files Uploaded") {
            setTimeout(function() {
                var locModal = document.getElementById('mymod');
                locModal.style.display = "none";
                locModal.className="modal fade";
                launch_toast('deploy', mapname.charAt(0).toUpperCase()+ mapname.slice(1) + ' map has been undeployed.', "Undeployed Map");
                refreshTable();
            }, 2200);
        } else {
            var locModal = document.getElementById('mymod');
            locModal.style.display = "none";
            locModal.className="modal fade";

            document.getElementById("errmsg").innerHTML = "Error in undeploying map, please view error log.";
            var locModal4 = document.getElementById('errmod');
            locModal4.style.display = "block";
            locModal4.style.paddingRight = "17px";
            locModal4.className="modal fade show";
        }
    });
}

function update(button) {
    document.getElementById("mapName").classList.remove("required");
    document.getElementById("mapID").classList.remove("required");
    var userid = "";
    var maptag = "";
    axios.get('/extractor/js/maps.json')
    .then(function (response) {
        for (var i=0; i < response.data.length; i++) {
            if (response.data[i].name == button.value) {
                userid = response.data[i].id;
                maptag = response.data[i].tag;
            }
        }
        updatemain(button.value, userid,'update',maptag);
    })
}

function view(button) {
    document.getElementById("mapName").classList.remove("required");
    document.getElementById("mapID").classList.remove("required");
    var butval = button.value;
    var valparts = butval.split("<NAME:>");
    var version = valparts[0];
    var mapname = valparts[1];
    axios.get('/view?mapname=' + mapname + '&version=' + version)
    .then(function (response) {
        if (response.data == "Files Uploaded") {
            window.open('/viewmap?mapname=' + mapname, '_blank').focus();
        } else {
            var locModal = document.getElementById('mymod');
            locModal.style.display = "none";
            locModal.className="modal fade";

            document.getElementById("errmsg").innerHTML = "Error in viewing map, please view error log.";
            var locModal4 = document.getElementById('errmod');
            locModal4.style.display = "block";
            locModal4.style.paddingRight = "17px";
            locModal4.className="modal fade show";
        }
    });
}

function refreshTable() {
    document.getElementById("mapName").classList.remove("required");
    document.getElementById("mapID").classList.remove("required");

    document.getElementById("openlog").style.display = "none";
    let table1 = new DataTable('#datatable');
    table1.destroy();

    const myNode = document.getElementById("tbdy");
    while (myNode.firstChild) {
        myNode.removeChild(myNode.lastChild);
    }

    axios.get('/deploy/js/activemaps.json')
    .then(function (response) {
        for (var i=0; i < response.data.length; i++) {
            var tby = document.getElementById("tbdy");
            var row = tby.insertRow(0);
            var cell1 = row.insertCell(0);
            var cell2 = row.insertCell(1);
            var cell3 = row.insertCell(2);
            var cell4 = row.insertCell(3);
            var cell5 = row.insertCell(4);
            cell1.innerHTML = JSON.stringify(response.data[i].mapid).replace(/"/g, "");
            cell2.innerHTML = JSON.stringify(response.data[i].name).replace(/"/g, "");
            cell3.innerHTML = JSON.stringify(response.data[i].datetime).replace(/"/g, "");
            const myDate = moment(response.data[i].datetime, 'DD-MM-YYYY HH:mm:ss').toDate();
            var dte = myDate.toISOString();
            cell3.setAttribute("data-sort", dte);
            cell4.innerHTML = JSON.stringify(response.data[i].version).replace(/"/g, "");
            if (response.data[i].deployed == 0) {
                cell5.innerHTML = "<input type='image' title='View' onclick='view(this);' value='" + cell4.innerHTML + "<NAME:>" + cell2.innerHTML + "' src='/static/images/view.png' width=25px/><input type='image' title='Deploy' onclick='deploy(this);' value='" + cell4.innerHTML + "<NAME:>" + cell2.innerHTML + "' src='/static/images/deploy.png' width=25px /><input type='image' title='Update' onclick='update(this);' value='" + cell2.innerHTML + "' src='/static/images/update.png' width=25px/><input type='image' title='Delete' onclick='checkdelete(this);' value='" + cell4.innerHTML + "<NAME:>" + cell2.innerHTML + "' src='/static/images/delete.png' width=25px/>";
            } else {
                cell4.innerHTML += " (Deployed)";
                cell5.innerHTML = "<input type='image' title='View' onclick='view(this);' value='" + response.data[i].version + "<NAME:>" + cell2.innerHTML + "' src='/static/images/view.png' width=25px/><input type='image' title='Deploy' onclick='deploycheck(this);' value='" +  cell2.innerHTML + "' src='/static/images/undeployed.png' width=25px /><input type='image' title='Update' onclick='update(this);' value='" + cell2.innerHTML + "' src='/static/images/update.png' width=25px/><input type='image' title='Delete' onclick='checkdelete(this);' value='" + response.data[i].version + "<NAME:>" + cell2.innerHTML + "' src='/static/images/delete.png' width=25px/>";
            }
        }
        document.getElementById('mapn').setAttribute('colspan','0.8');
        document.getElementById('new').setAttribute('colspan','0.8');
        document.getElementById('act').setAttribute('colspan','0.8');

        $.fn.dataTable.moment('DD-MM-YYYY HH:mm:ss');
        let table = new DataTable('#datatable', {
            select: true,
            searching: true,
            lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "All"]],
            scrollY:        "30vh",
            scrollCollapse: true,
            destroy: true
        });
        table.order( [ 1, 'desc' ] ).draw();
        table.columns.adjust().draw();
        document.getElementById("openlog").style.display = "block";
    });
}

function getLog(combo) {
    const myNode = document.getElementById("filter");
    while (myNode.children.length > 1) {
        myNode.removeChild(myNode.lastChild);
    }
    document.getElementById('filter').name = "";
    document.getElementById('dlog').style.display = 'none';
    const myNode1 = document.getElementById("loginfo");
    while (myNode1.firstChild) {
        myNode1.removeChild(myNode1.lastChild);
    }
    if (combo.selectedIndex != 0) {
        if (combo.value != "devices") {
            document.getElementById('filter').options[0].innerHTML = 'All';
            axios.get('/extractor/js/maps.json')
            .then(function (resp) {
                for (var p=0; p < resp.data.length;p++) {
                    var elem = document.createElement("option");
                    elem.innerHTML = resp.data[p].name;
                    elem.setAttribute("value", resp.data[p].name);
                    document.getElementById('filter').appendChild(elem);
                }

                axios.get('/logs/' + combo.value + '.log')
                .then(function (response) {
                    var lines = (response.data).split("\n"); 
                    lines.reverse();
                    for (var i=0; i < lines.length; i++) {
                        if (lines[i] != "") {
                            var node = document.createElement("li");
                            node.innerHTML = lines[i];
                            node.setAttribute("class", 'list-group-item');
                            document.getElementById('loginfo').appendChild(node);
                        }
                    }
                });
            });
        } else {
            axios.get('/devices/devices.json')
            .then(function (resp) {
                for (var p=0; p < resp.data.length;p++) {
                    var elem = document.createElement("option");
                    elem.innerHTML = resp.data[p].PCID;
                    elem.setAttribute("value", resp.data[p].PCID);
                    document.getElementById('filter').appendChild(elem);
                }
                document.getElementById('filter').name = 'device';
            });
            document.getElementById('filter').options[0].innerHTML = 'Select One';
        }
    }
}

function filterList() {
    if (document.getElementById('filter').name != 'device') {
        var filterText = document.getElementById('filter').value,
        lis = document.querySelectorAll('#loginfo li'), x;

        for (x = 0; x < lis.length; x++) {
            if (filterText === '' || lis[x].innerHTML.indexOf(filterText) > -1) {
                lis[x].removeAttribute('hidden');
            }
            else {
                if (filterText == "all") {
                    lis[x].removeAttribute('hidden');
                } else {
                    lis[x].setAttribute('hidden', true);
                }
            }
        }
    } else {
        document.getElementById('devlog').selectedIndex = 0;
        if (document.getElementById('filter').value != 'all') {
            document.getElementById('dlog').style.display = 'inline';
        } else {
            const myNode1 = document.getElementById("loginfo");
            while (myNode1.firstChild) {
                myNode1.removeChild(myNode1.lastChild);
            }
            document.getElementById('dlog').style.display = 'none';
        }
    }
}

function deviceLogs(combo) {
    const myNode1 = document.getElementById("loginfo");
    while (myNode1.firstChild) {
        myNode1.removeChild(myNode1.lastChild);
    }
    axios.get('/devices/' + document.getElementById('filter').value + '/' +combo.value + '.log')
    .then(function (response) {
        var lines = (response.data).split("\n"); 
        lines.reverse();
        for (var i=0; i < lines.length; i++) {
            if (lines[i] != "") {
                var node = document.createElement("li");
                node.innerHTML = lines[i];
                node.setAttribute("class", 'list-group-item');
                document.getElementById('loginfo').appendChild(node);
            }
        }
    })
}

function addMap() {
    var mapname = document.getElementById("mapName").value;
    var mapid = document.getElementById("mapID").value;
    if (mapname == "" || mapid == "") {
        if (mapname == "") {
            document.getElementById("mapName").setAttribute("placeholder", "Required");
            document.getElementById("mapName").setAttribute("class", "required");
        } else {
            document.getElementById("mapName").classList.remove("required");
        }
        if (mapid == "") {
            document.getElementById("mapID").setAttribute("placeholder", "Required");
            document.getElementById("mapID").setAttribute("class", "required");
        } else {
            document.getElementById("mapID").classList.remove("required");
        }
    } else {
        document.getElementById("mapName").classList.remove("required");
        document.getElementById("mapID").classList.remove("required");
        
        document.getElementById("loadmsg").innerHTML = "Please wait your action is being processed...";
        var locModal2 = document.getElementById('mymod');
        locModal2.style.display = "block";
        locModal2.style.paddingRight = "17px";
        locModal2.className="modal fade show";
        
        var maphash = "";
        var maptag = "";
        if (mapid.includes("storymapjs")) {
            if (mapid.includes("/")) {
                var idparts = mapid.split("/");
                var index = idparts.findIndex( x => x == "storymapjs" );
                if (idparts[index+1] != null && idparts[index+2] != null) {
                    document.getElementById("mapID").classList.remove("error");
                    maphash = idparts[index+1];
                    maptag = idparts[index+2];
                } else {
                    var locModal = document.getElementById('mymod');
                    locModal.style.display = "none";
                    locModal.className="modal fade";
                    popover('mapid');
                }
            } else {
                var locModal = document.getElementById('mymod');
                locModal.style.display = "none";
                locModal.className="modal fade";
                popover('mapid');
            }
        } else {
            var locModal = document.getElementById('mymod');
            locModal.style.display = "none";
            locModal.className="modal fade";
            popover('mapid');
        }
        var newmapname = "";
        var specials=/[*|\":<>[\]{}`\\()';@&$ ]/;
        if (specials.test(mapname)) {
            var locModal = document.getElementById('mymod');
            locModal.style.display = "none";
            locModal.className="modal fade";
            popover('mapname');
        } else {
            newmapname = mapname;
            document.getElementById("mapName").classList.remove("error");
        }

        if (maphash != "" && newmapname != "" && maptag != "") {
            axios.get('/new?mapname=' + newmapname + '&maphash=' + maphash + '&maptag=' + maptag)
            .then(function (response) {
                if (response.data == "Files Uploaded") {
                    updatemain(newmapname, maphash, 'newmap', maptag);
                    document.getElementById("mapName").value = "";
                    document.getElementById("mapID").value = "";
                } else {
                    var locModal = document.getElementById('mymod');
                    locModal.style.display = "none";
                    locModal.className="modal fade";

                    document.getElementById("errmsg").innerHTML = response.data;
                    var locModal4 = document.getElementById('errmod');
                    locModal4.style.display = "block";
                    locModal4.style.paddingRight = "17px";
                    locModal4.className="modal fade show";
                }
            });
        }
        
    }
}

function closeErr() {
    var locModal = document.getElementById('errmod');
    locModal.style.display = "none";
    locModal.className="modal fade";
}

function editText(button) {
    if (button.id == "mapID") {
        $('[data-toggle="popover"]').popover('dispose');
    } else {
        $('[data-toggle="validator"]').popover('dispose');
    }
}

function popover(input) {
    if (input == "mapid") {
        $('[data-toggle="popover"]').popover({title: "Invalid Map Url", content: "Please enter a valid map url.", trigger:"hover", placement: "bottom", container: 'body'});  
        document.getElementById("mapID").setAttribute("class", "error");
    } else if (input == "mapname") {
        $('[data-toggle="validator"]').popover({title: "Restricted Special Characters", content: "The map name can not contain any special characters or spaces.", trigger:"hover", container: 'body', placement: "bottom"});   
        document.getElementById("mapName").setAttribute("class", "error");
    }
}

function openLogs() {
    var locModal = document.getElementById('logs');
    locModal.style.display = "block";
    locModal.style.paddingRight = "17px";
    locModal.className="modal fade show";
}

function launch_toast(action, msg, topmsg) {
    var d = new Date();
    var day = d.toString().split(' ')[0];
    var time = d.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });

    document.getElementById('message').innerHTML = "<img src='/static/images/" + action + ".png' width=15px />   " + action.charAt(0).toUpperCase()+ action.slice(1);
    document.getElementById('time').innerHTML = day + " " + time;
    document.getElementById('body').innerHTML = "<strong>" + topmsg+ "</strong><br>" + msg;

    var x = document.getElementById("toast");
    x.className = "show";
    setTimeout(function(){
        x.setAttribute('class','');
    }, 5000);
}

function closeMod() {
    var locModal = document.getElementById('logs');
    locModal.style.display = "none";
    locModal.className="modal fade";
}

function closeModal() {
    var locModal = document.getElementById('checkmod');
    locModal.style.display = "none";
    locModal.className="modal fade";
}

function undepclose() {
    var locModal = document.getElementById('undep');
    locModal.style.display = "none";
    locModal.className="modal fade";
}