var EXPORTED_SYMBOLS = ["jobmanagerMisc"];

Components.utils.import("chrome://jobmanager/content/modules/db.js");
Components.utils.import("chrome://jobmanager/content/modules/dialogs.js");

_jobmanagerMisc = function(){
	
	var that = this;
	
	this.fillReportsContextMenu = function( menuId, document ){
		var menu = document.getElementById( menuId );
		while( menu.firstChild ){
			menu.removeChild( menu.firstChild );
		}
		
		jobmanagerDB.listClients( function( clients ){
			
			dump( "FOUND CLIENTS: " + clients.length + "\n" );
			
			for( var i = 0; i != clients.length; i++ ){
				var client = clients[i];
				var menuitem = document.createElement( "menuitem" );
				menuitem.setAttribute("label", client.name);
				(function(client){
					menuitem.addEventListener( "command", function( event ){
						jobmanagerDialogs.displayModalDialog(document.defaultView, "monthly_report", {
							"id": client.id
						});						
						
						event.stopPropagation();
					}, false );
				})(client);
				menu.appendChild( menuitem );
			}
			
		} );
	}
	
}

jobmanagerMisc = new _jobmanagerMisc();
