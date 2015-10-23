var EXPORTED_SYMBOLS = ["jobmanagerDialogs"];

jobmanagerDialogs = {
	displayModalDialog: function( window, name, params ){
		window.openDialog("chrome://jobmanager/content/dialogs/"+name+".xul", '', 'chrome,titlebar,toolbar,centerscreen,modal', params);
	},
	
	displayDialog: function( window, name, params ){
		var dialog = window.openDialog("chrome://jobmanager/content/dialogs/"+name+".xul", '', 'chrome,titlebar,toolbar,centerscreen,dialog=yes', params);
		this.setWindowRaised( dialog, true ); 
	},
	
	setWindowRaised: function(window, raised){
		var Ci = Components.interfaces;
		var xulWin = window.QueryInterface(Ci.nsIInterfaceRequestor).getInterface(Ci.nsIWebNavigation).QueryInterface(Ci.nsIDocShellTreeItem)
		   .treeOwner.QueryInterface(Ci.nsIInterfaceRequestor)
		   .getInterface(Ci.nsIXULWindow);
		xulWin.zLevel = raised ? xulWin.raisedZ : xulWin.normalZ;		
	},
	
	alert: function( type ){
		var bundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService).createBundle("chrome://jobmanager/locale/alert.properties"); 
		
		var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]  
		                        .getService(Components.interfaces.nsIPromptService);  
		  
		prompts.alert(null, bundle.GetStringFromName( type+".title" ), bundle.GetStringFromName( type+".text" ));  
	}
}
