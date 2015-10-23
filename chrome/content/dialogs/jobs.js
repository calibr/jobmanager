/**
 * 
 * Job listing
 * 
 */

Components.utils.import("chrome://jobmanager/content/modules/db.js");
Components.utils.import("chrome://jobmanager/content/modules/dialogs.js");

var needRefreshJobListing = false;

// interval to check if sheduled refresh job listing
setInterval( function(){
	
	if( needRefreshJobListing ){
		refreshJobsListing();
	}
	
}, 100 );

var lastRefreshMinute = (new Date()).getMinutes();

// interval to referesh job listing each minute
setInterval( function(){		
	var currentMinute = (new Date()).getMinutes();
	if( lastRefreshMinute != currentMinute ){
		sheduleRefreshJobsListing();		
		lastRefreshMinute = currentMinute;
	}	
}, 1000 );

function doAddJob(){
	jobmanagerDialogs.displayModalDialog( window, "add_job" );	
}

function getSelectedIds(){
	var ids = [];
	
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
                ids.push( parseInt(id) );
            }
        }
    } 
    catch (ex) {
 
    }

	return ids;
}

function updateSelectedClient(){
    try {
		var selectedIds = getSelectedIds();
		
		if( selectedIds.length == 0 ){
			jobmanagerDialogs.alert( "jobs.select_clients_for_editing" );
			return false;
		}
		
		var id = selectedIds[0];
		
        jobmanagerDialogs.displayModalDialog(window, "add_job", {
            "id": id
        });
    } 
    catch (ex) {

    }
    
}

function finishSelectedJobs(){
	var ids = getSelectedIds();
	for( var i = 0; i != ids.length; i++ ){
		jobmanagerDB.endJob( ids[i] );
	}
	sheduleRefreshJobsListing();	
}

function resumeSelectedJobs(){
	var ids = getSelectedIds();
	for( var i = 0; i != ids.length; i++ ){
		jobmanagerDB.startJob( ids[i] );
	}
	sheduleRefreshJobsListing();
}

function pauseSelectedJobs(){
	
	var ids = getSelectedIds();
	for( var i = 0; i != ids.length; i++ ){
		jobmanagerDB.pauseJob( ids[i] );
	}
	sheduleRefreshJobsListing();
	
}

function removeSelectedJobs(){
	
    try {
		var ids = getSelectedIds();
		for( var i = 0; i != ids.length; i++ ){
			jobmanagerDB.deleteJob(ids[i]);
		}  		
    } 
    catch (ex) {
 
    }
	finally{
		sheduleRefreshJobsListing();
	}
}

function sheduleRefreshJobsListing(){
	needRefreshJobListing = true;
}

function refreshJobsListing(){	
	
	try{
		var selectedIds = getSelectedIds();
		var selectedIndexes = [];
		        		
        var container = document.getElementsByTagName("treechildren")[0];
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
		
		jobmanagerDB.listJobs(" WHERE `status` != 'finished' ", {
			func: function( jobs ){				
				if( jobs != null ){
			        for (var i = 0; i != jobs.length; i++) {	
										
						(function( container, job ){
							var treeitem = document.createElement("treeitem");
				            var treerow = document.createElement("treerow");
				            
				            var cellId = document.createElement("treecell");
				            var cellStatus = document.createElement("treecell");
				            var cellDesc = document.createElement("treecell");
				            var cellStartDate = document.createElement("treecell");
				            var cellElapsed = document.createElement("treecell");
				            var cellEarned = document.createElement("treecell");
				            																						
							jobmanagerDB.getJobElapsedTime(job.id,{
								func: function( elapsed, i ){
									if( elapsed != null ){										
										jobmanagerDB.getJobEarnings(job.id, {
											func: function( earned, i ){
													if( earned != null ){
														if( selectedIds.indexOf( parseInt(job.id) ) != -1 ){				
															selectedIndexes.push( i );
														}
														
											            cellId.setAttribute("label", job.id);
											            cellStatus.setAttribute("label", job.status);
											            cellDesc.setAttribute("label", job.description);
											            cellStartDate.setAttribute("label", job.startDate);
											            cellElapsed.setAttribute("label", elapsed);
											            cellEarned.setAttribute("label", "$"+earned);
											            
											            treerow.appendChild(cellId);
											            treerow.appendChild(cellStatus);
											            treerow.appendChild(cellDesc);
											            treerow.appendChild(cellStartDate);
											            treerow.appendChild(cellElapsed);
											            treerow.appendChild(cellEarned);
											            
											            treeitem.appendChild(treerow);
														
														container.appendChild( treeitem );
													}
													
													if( i == jobs.length - 1 ){
														// persist selection	
														var tree = document.getElementsByTagName("tree")[0];
														for( var i = 0; i != selectedIndexes.length; i++ ){
															tree.view.selection.select( selectedIndexes[i] );
														}										
													}
													
													
												},
											inst: window,
											args: [i]
										});
									}
									else{
							
									}
									
								},
								inst: window,
								args: [i]
							});
																					
							
						})( container, jobs[i] );
						
			            
			        }
				}
			},
			inst: window
		});
	}
	catch( ex ){

	}
	finally{
		needRefreshJobListing = false;
	}

}


// raw code starts

var observer = {
    observe: function(subject, topic, data){
    	switch( topic ){
			case "JM:jobAdded":
				try{
					jobmanagerDB.startJob( data );					
				}
				catch( ex ){
		
				}			
			case "JM:jobUpdated":			
			case "JM:jobRemoved":	

				sheduleRefreshJobsListing();
			break;
		}
    }
};

var observerService = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);  
observerService.addObserver(observer, "JM:clientUpdated", false);  
observerService.addObserver(observer, "JM:jobAdded", false);  
observerService.addObserver(observer, "JM:jobUpdated", false);  
observerService.addObserver(observer, "JM:jobRemoved", false);  


window.addEventListener( "load", function(){
	refreshJobsListing();
} );
