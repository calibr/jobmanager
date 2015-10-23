/**
 *
 * Clients listing
 *
 */
Components.utils.import("chrome://jobmanager/content/modules/db.js");
Components.utils.import("chrome://jobmanager/content/modules/dialogs.js");

function monthlyReport(){
	try{
		var tree = document.getElementsByTagName("tree")[0];
		var column = tree.columns.getColumnAt(0);
		var id = tree.view.getCellText(tree.view.selection.currentIndex, column);
		
        jobmanagerDialogs.displayModalDialog(window, "monthly_report", {
            "id": id
        });
	}
	catch( ex ){
		alert(ex);
	}
}

function addClient(){
    try {
        var params = {};
        jobmanagerDialogs.displayModalDialog(window, "add_client", params);
    } 
    catch (ex) {
    
    }
}

function updateClient(){
    try {
        var tree = document.getElementsByTagName("tree")[0];
        var column = tree.columns.getColumnAt(0);
        
        var id = tree.view.getCellText(tree.view.selection.currentIndex, column);
        
        jobmanagerDialogs.displayModalDialog(window, "add_client", {
            "id": id
        });
    } 
    catch (ex) {

    }
    
}


function deleteClient(){
    try {
        var tree = document.getElementsByTagName("tree")[0];
        
        var start = new Object();
        var end = new Object();
        var numRanges = tree.view.selection.getRangeCount();
        
        var column = tree.columns.getColumnAt(0);
        
        for (var t = 0; t < numRanges; t++) {
            tree.view.selection.getRangeAt(t, start, end);
            for (var v = start.value; v <= end.value; v++) {
                var id = tree.view.getCellText(v, column);
                jobmanagerDB.deleteClient(id);
            }
        }
    } 
    catch (ex) {
 
    }
}



function refreshClientsListing(){    
    var container = document.getElementsByTagName("treechildren")[0];
    
    while (container.firstChild) {
        container.removeChild(container.firstChild);
    }
    
	jobmanagerDB.listClients( {
		func: function( clients ){
			
			if( clients ){
				
			    for (var i = 0; i != clients.length; i++) {
			        var client = clients[i];
						
			        var treeitem = document.createElement("treeitem");
			        var treerow = document.createElement("treerow");
			        var cellId = document.createElement("treecell");
			        var cellName = document.createElement("treecell");
			        var cellDefaultPrice = document.createElement("treecell");
			        
			        cellId.setAttribute("label", client.id);
			        cellName.setAttribute("label", client.name);
			        cellDefaultPrice.setAttribute("label", client.defaultHourPrice);
			        treerow.appendChild(cellId);
			        treerow.appendChild(cellName);
			        treerow.appendChild(cellDefaultPrice);
			        treeitem.appendChild(treerow);
			        
			        container.appendChild(treeitem);
			    }
					
			}
				
		},
		
		inst: window
	} );

}


// raw code starts

var observer = {
    observe: function(subject, topic, data){
    	switch( topic ){
			case "JM:clientUpdated":
			case "JM:clientAdded":
			case "JM:clientRemoved":		
				refreshClientsListing();
			break;
		}
    }
};

var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);  
observerService.addObserver(observer, "JM:clientUpdated", false);  
observerService.addObserver(observer, "JM:clientAdded", false);  
observerService.addObserver(observer, "JM:clientRemoved", false);  

// refresh clients listing on window load
window.addEventListener("load", function(){
    refreshClientsListing();
});
