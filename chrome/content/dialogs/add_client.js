try{
	Components.utils.import("chrome://jobmanager/content/modules/db.js");
	Components.utils.import("chrome://jobmanager/content/modules/dialogs.js");
	Components.utils.import("chrome://jobmanager/content/modules/properties.js");	
}
catch( ex ){

}

var isUpdate = false;

var xxx = "hell";

function doAdd(){			
	try{
		var name = document.getElementById("boxName").value.trim();
		var defaultHourPrice = document.getElementById("boxDefaultHourPrice").value;
		
		if( !name ){
			jobmanagerDialogs.alert( "add_client.empty_name" );	
			return false;
		}
		
		if( !isUpdate ){	
			
			jobmanagerDB.clientExistsByName( name, {
				func: function( result, jobmanagerDB, jobmanagerDialogs ){	
					if( result ){
						jobmanagerDialogs.alert( "add_client.already_exist" );	
					}
					else{			
						// add client to database
						jobmanagerDB.addClient( name, defaultHourPrice );
					}
				},
				inst: window,
				args: [ jobmanagerDB, jobmanagerDialogs ] 
			});


		}		
		else{
			jobmanagerDB.clientExistsByName( name, {
				func: function( existsId, currentUserId, jobmanagerDialogs, jobmanagerDB ){										
					if( existsId != 0 && existsId != currentUserId ){
						jobmanagerDialogs.alert( "add_client.already_exist" );	
					}
					else{
						jobmanagerDB.editClient( currentUserId, name, defaultHourPrice );
					}				
				},
				inst: window,
				args: [window.arguments[0].id, jobmanagerDialogs, jobmanagerDB]
			} );
		}		
	}
	catch( ex ){
		dump( "Exception in dialog 'client addition': " + ex + "\r\n" );
	}
	
			
	window.close();		
}


function init(){
	var button = document.getElementById( "addButton" );	

	if( window.arguments[0] && typeof window.arguments[0].id != "undefined" ){
		isUpdate = true;
	}
	
	button.setAttribute( "label" , jobmanagerProperties.get( "misc", isUpdate ? "add_client.add_label_update" : "add_client.add_label_add" ) );
	
	if( isUpdate ){
		// init default values
		jobmanagerDB.getClient( window.arguments[0].id, {
			func: function( client ){
				document.getElementById("boxDefaultHourPrice").value = client.defaultHourPrice;
				document.getElementById("boxName").value = client.name;
			},
			inst: window			
		} );

	}
}



window.addEventListener( "load", function(){
	init();
	
} );
