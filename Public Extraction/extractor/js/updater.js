function updatemain(mapname, mapid, source, tag) {

	var locModal = document.getElementById('mymod');
	locModal.style.display = "block";
	locModal.style.paddingRight = "17px";
	locModal.className="modal fade show";

	axios.get('/update?mapname=' + mapname + '&mapid=' + mapid + '&tag=' + tag)
	.then((response) => {
		if (response.data == 'No Update') {
			setTimeout(function(){
				var locModal = document.getElementById('mymod');
				locModal.style.display = "none";
				locModal.className="modal fade";

				launch_toast('update', mapname.charAt(0).toUpperCase()+ mapname.slice(1) + ' map has not been updated.', 'No New Update');
			}, 1000);	
		} else if (response.data == 'Files Uploaded') {
			setTimeout(function(){
				var locModal = document.getElementById('mymod');
				locModal.style.display = "none";
				locModal.className="modal fade";
				if (source == "newmap") {
					launch_toast('map', mapname.charAt(0).toUpperCase()+ mapname.slice(1) + ' map has been added to the system.', "New Map Added");
				} else {
					launch_toast('update', mapname.charAt(0).toUpperCase()+ mapname.slice(1) + ' map has been updated.', 'Updated Map');	
				}
				refreshTable();
			}, 1000);	
		} else {
			var locModal = document.getElementById('mymod');
            locModal.style.display = "none";
            locModal.className="modal fade";

            document.getElementById("errmsg").innerHTML = "Error in updating map, please view error log.";
            var locModal4 = document.getElementById('errmod');
            locModal4.style.display = "block";
            locModal4.style.paddingRight = "17px";
            locModal4.className="modal fade show";
		}
	})
}