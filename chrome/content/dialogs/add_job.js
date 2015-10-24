try{
	Components.utils.import("chrome://jobmanager/content/modules/db.js");
	Components.utils.import("chrome://jobmanager/content/modules/dialogs.js");
	Components.utils.import("chrome://jobmanager/content/modules/properties.js");
}
catch( ex ){

}

var isUpdate = false;

function init(){
	try{
		var button = document.getElementById( "addButton" );

		if( window.arguments[0] && typeof window.arguments[0].id != "undefined" ){
			isUpdate = true;
		}

		button.setAttribute( "label" , jobmanagerProperties.get( "misc", isUpdate ? "add_job.add_label_update" : "add_job.add_label_add" ) );

		if( isUpdate ){
			// init default values
			jobmanagerDB.getJob( window.arguments[0].id, {
				func: function( job ){
					if( job != null ){
						document.getElementById( "boxDescription" ).value = job.description;
						document.getElementById( "boxClient" ).value = job.clientId;
						document.getElementById( "boxHourPrice" ).value = job.hourPrice;
					}
				},
				inst: window
			} );

		}

		var container = document.getElementById( "boxDescription" ).getElementsByTagName("menupopup")[0];
		jobmanagerDB.jobNamesUnique( 10, {
			func: function( jobNames ){
				for( var i = 0; i != jobNames.length; i++ ){
					var menuitem = document.createElement( "menuitem" );
					menuitem.setAttribute( "label", jobNames[i] );
					container.appendChild( menuitem );
				}
			},
			inst: window
		} );


	}
	catch( ex ){

	}
}


function doAdd(){
	try{
		var description = document.getElementById( "boxDescription" ).value;
		var clientId = document.getElementById( "boxClient" ).value;
		var hourPrice = document.getElementById( "boxHourPrice" ).value;

		if( isUpdate ){
			jobmanagerDB.editJob( window.arguments[0].id, {
				"description": description,
				"client_id": clientId,
				"hour_price": hourPrice
			} );
		}
		else{
			jobmanagerDB.addJob(clientId, description, hourPrice);
		}
	}
	catch( ex ){

	}

	window.close();
}

function doSelectClient(){
	//  get client info and update hour price field
	var clientId = document.getElementById( "boxClient" ).value;
	if( clientId != "" ){
		jobmanagerDB.getClient( clientId, {
			func: function( client ){
				if( client != null ){
					document.getElementById( "boxHourPrice" ).value = client.defaultHourPrice;
				}
			},
			inst: window
		} );

	}
}

function refreshClientsList( callback ){
	var prevValue = document.getElementById( "boxClient" ).value;

	var container = document.getElementById( "boxClient" ).getElementsByTagName("menupopup")[0];

	while( container.firstChild ){
		container.removeChild( container.firstChild );
	}

	jobmanagerDB.listClients({
		func: function( clients, jobmanagerDialogs ){

			if( clients != null ){

				if( clients.length == 0 ){
					jobmanagerDialogs.alert( "add_job.clients_not_found" );
					window.close();
				}

				for( var i = 0; i != clients.length; i++ ){
					var item = document.createElement( "menuitem" );
					item.setAttribute( "label", clients[i].name );
					item.setAttribute( "value", clients[i].id );

					container.appendChild( item );
				}

				if( prevValue == "" ){
					prevValue = clients.length != 0 ? clients[0].id : 0;
				}

				document.getElementById( "boxClient" ).value = prevValue;

				doSelectClient();

			}

			if( callback ){
				callback();
			}

		},
		inst: window,
		args: [jobmanagerDialogs]
	});


}


window.addEventListener( "load", function(){
	try{
		refreshClientsList(function(){
			init();
		});
	}
	catch( ex ){

	}

} );