var EXPORTED_SYMBOLS = ["jobmanagerProperties"];

jobmanagerProperties = {
	get: function( fileName, string ){
		var bundle = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService).createBundle("chrome://jobmanager/locale/"+fileName+".properties"); 
		return bundle.GetStringFromName( string );
	}
}
