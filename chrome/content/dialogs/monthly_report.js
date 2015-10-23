/**
 * Monthly report
 *
 */
Components.utils.import("chrome://jobmanager/content/modules/db.js");
Components.utils.import("chrome://jobmanager/content/modules/dialogs.js");

function subtreeJobs( jobs ){
	var treechildren = document.createElement( "treechildren" );
	
	for( var jobName in jobs ){
		var price = Math.round( jobs[ jobName ] * 100 )/100;
		
		var treeitem = document.createElement( "treeitem" );
		var treerow = document.createElement( "treerow" );
		var cellName = document.createElement( "treecell" );
		var cellPrice = document.createElement( "treecell" );		
		
		cellName.setAttribute( "label", jobName );
		cellPrice.setAttribute( "label", "$"+price );		
		
		treerow.appendChild( cellName );
		treerow.appendChild( cellPrice );		
		treeitem.appendChild( treerow );
		
		treechildren.appendChild( treeitem );
	}
	
	return treechildren;
}

function display(){
	try{
		var year = document.getElementById( "year" ).value;
			
		var monthsNames = [
			"January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"
		];
		
		var months = {};
		var monthsJobsNames = {};
		
		var buildList = function(){
			var tree = document.getElementsByTagName("tree")[0];
			var container = tree.getElementsByTagName( "treechildren" )[0];
			
			while( container.firstChild ){
				container.removeChild( container.firstChild );
			}
			
			for( var i = 0; i != monthsNames.length; i++ ){
				var earned = 0;
				var name = monthsNames[i];
				if( months[ i ] ){
					earned =  Math.round( months[i] * 100 )/100;
				}
				
				var treeitem = document.createElement( "treeitem" );
				var treerow = document.createElement( "treerow" );
				var cellMonth = document.createElement( "treecell" );
				var cellYearned = document.createElement( "treecell" );	
				
				cellMonth.setAttribute("label", name);		
				cellYearned.setAttribute("label", "$"+earned);			
				
				treerow.appendChild( cellMonth );
				treerow.appendChild( cellYearned );			
				treeitem.appendChild( treerow );	
				
				if( typeof monthsJobsNames[i] != "undefined" ){
					var treechildren = subtreeJobs( monthsJobsNames[i] );
					treeitem.appendChild( treechildren );
					treeitem.setAttribute( "container", true );
				}
				
				
				container.appendChild( treeitem );	
			}
		}
		
		jobmanagerDB.getJobsInYear( year, {
			func: function( jobs, jobmanagerDB ){				
				
				var tmp = [];
				for (var i = 0; i != jobs.length; i++) {
					var job = jobs[i];
					if( job.clientId != window.arguments[0].id ){
						continue;
					}
					tmp.push( job );
				}
				
				jobs = tmp;
				
				for( var i = 0; i != jobs.length; i++ ){		
					var job = jobs[ i ];
					
					var date = jobmanagerDB._parseDate( job.startDate );
					
					var month = (new Date(date)).getMonth();
					
					if( typeof months[month] == "undefined" ){
						months[month] = 0;
					}
					(function( job, i, count ){
						
						jobmanagerDB.getJobEarnings( job.id, {
							func: function( jobEarnings, i, count ){
								if( jobEarnings != null ){
									months[month] += jobEarnings;
									
									if( typeof monthsJobsNames[month] == "undefined" ){
										monthsJobsNames[month] = {};
									}
									if( typeof monthsJobsNames[month][job.description]  == "undefined" ){
										monthsJobsNames[month][job.description] = 0;
									}
									
									monthsJobsNames[month][job.description] += jobEarnings;
								}
								
								if( i == count - 1 ){													
									buildList();
								}
								
							},
							inst: window,
							args: [i, count]
						} );
					})( job, i, jobs.length );
					
				}
				
				if( jobs.length == 0 ){
					buildList();
				}
				
			},
			inst: window,
			args: [jobmanagerDB]
		} );
	}
	catch( ex ){

	}
	

}

window.addEventListener( "load", function(){
	
	document.getElementById( "year" ).value = (new Date()).getFullYear();
	display();
	
}, true );
