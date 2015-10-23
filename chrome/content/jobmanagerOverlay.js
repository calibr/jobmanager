Components.utils.import("chrome://jobmanager/content/modules/db.js");
Components.utils.import("chrome://jobmanager/content/modules/dialogs.js");
Components.utils.import("chrome://jobmanager/content/modules/misc.js");


var jobManagerOverlay = {
	
	observer: null,
	branch: null,
	
	lastRefreshStatusBarMinute: null,
	
	toolbarButtonId: "jobmanagerButton",
	helpPanelId: "jobManagerFirstInstallHelpPanel",
	
	notFoundEarningsStatusBarTitle: "N/A",
	
	branchName: "extensions.jobmanager.",
	_isFirsStart: null,
		
	observerHandler: {
	    observe: function(subject, topic, data){
	    	jobManagerOverlay.refreshActiveJobsEarnings();
	    }
	},
	
	unload: function(){
		this.observer.removeObserver(this.observerHandler, "JM:clientUpdated", false);  
		this.observer.removeObserver(this.observerHandler, "JM:jobAdded", false);  
		this.observer.removeObserver(this.observerHandler, "JM:jobUpdated", false);  
		this.observer.removeObserver(this.observerHandler, "JM:jobRemoved", false);  
	},
	
	start: function(){		
	
		jobmanagerDB.connect();
				
		this.branch = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch(this.branchName);
						
		this.observer = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);  
		this.observer.addObserver(this.observerHandler, "JM:clientUpdated", false);  
		this.observer.addObserver(this.observerHandler, "JM:jobAdded", false);  
		this.observer.addObserver(this.observerHandler, "JM:jobUpdated", false);  
		this.observer.addObserver(this.observerHandler, "JM:jobRemoved", false);  
		
		this.isFirstStart(function( firstStart ){
			
			if(firstStart){
				this.addItemToToolbar( "nav-bar", this.toolbarButtonId );	
	
				window.setTimeout( function(){
					
					var panel = document.getElementById(jobManagerOverlay.helpPanelId);
					panel.openPopup( document.getElementById( jobManagerOverlay.toolbarButtonId ) );
					
				}, 5000 );
			}
			
		}, this);
				
	},
	
	openJobsWindow: function(){
		jobmanagerDialogs.displayDialog( window, "jobs" );
	},
	
	addItemToToolbar: function( toolbar, item ){
		var toolbar = document.getElementById(toolbar);
		
		if (toolbar && toolbar.currentSet.indexOf( item ) == -1)
		{
			var sci = toolbar.currentSet.split(',');
			var nsci = [];
			if (sci.indexOf('urlbar-container') != -1)
			{
				var i = null;
				while ((i = sci.shift()) != undefined)
				{
					if ((i == 'urlbar-container') && (nsci.indexOf(item) == -1)) nsci.push(item);
					nsci.push(i);
				}
			} else
			{
				nsci = sci;
				nsci.push(item);
			}

			toolbar.currentSet = nsci.join(',');
			toolbar.setAttribute('currentset', toolbar.currentSet);

			var toolbox = document.getElementById('navigator-toolbox');
			if (toolbox)
			{
				toolbox.ownerDocument.persist(toolbar.id, 'currentset');
				try
				{
					BrowserToolboxCustomizeDone(true);
		
				}catch (e) {
					
				}
			}
		}
	},
	
	isFirstStart: function( callback, thisElem ){
		if( this._isFirsStart != null ){
			return this._isFirsStart;
		}
		
		var firstStart = true;
		try{
			firstStart = this.branch.getBoolPref( "first_start" );			
		}
		catch( ex ){
			
		}
		
		this._isFirsStart = firstStart;
		
		this.branch.setBoolPref( "first_start", false );
		
		callback.call( thisElem, firstStart );
	},
	
	refreshActiveJobsEarnings: function(){		
	
		jobmanagerDB.activeJobsTotalEarning( {
			func: function( earnings ){	
			
				var elem = document.getElementById("jobManagerStatusBarMessage").getElementsByTagName("label")[0];
						
				if( earnings != null ){
					elem.setAttribute( "value", "$"+earnings );
				}
				else{
					elem.setAttribute( "value", jobManagerOverlay.notFoundEarningsStatusBarTitle );
				}
			},
			inst: window
		}  );

	}
	
}

window.addEventListener( "load", function(){
	jobManagerOverlay.start();	
	
	setInterval( function(){
		var currentMinute = (new Date()).getMinutes();
		if( currentMinute != jobManagerOverlay.lastRefreshStatusBarMinute ){
			jobManagerOverlay.refreshActiveJobsEarnings();	
			jobManagerOverlay.lastRefreshStatusBarMinute = currentMinute;
		}
	}, 1000 );
}, false );

window.addEventListener( "unload", function(){
	jobManagerOverlay.unload();	
} );

