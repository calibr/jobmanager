var EXPORTED_SYMBOLS = ["jobmanagerDB"];

jobmanagerDB = {
	// constants
	STORAGE_FOLDER: "JobManager",
	DB_FILE: "db.sqlite",
	
	// fields	
	_connection: null,
	_observer: null,
	
	// publics	
	connect: function(){
		this._observer = Components.classes["@mozilla.org/observer-service;1"].getService(Components.interfaces.nsIObserverService);		
		
		if( this.connection != null ){
			return;
		}
		
        var file = Components.classes['@mozilla.org/file/directory_service;1'].getService(Components.interfaces.nsIProperties).get('ProfD', Components.interfaces.nsIFile);
        file.append(this.STORAGE_FOLDER);
		
        if (!file.exists()) 
            file.create(Components.interfaces.nsIFile.DIRECTORY_TYPE, 0755);
        if (file.exists() && file.isDirectory()) {
            file.append(this.DB_FILE);
            
			if( !file.exists() ){

			}			
        }
		
		var storageService = Components.classes["@mozilla.org/storage/service;1"]
				                       .getService(Components.interfaces.mozIStorageService);
		this._connection = storageService.openDatabase(file);
		
		this._createTables();
	},
	
	/* Clients functions */	
	addClient: function( name, defaultHourPrice, callback ){
		var statement = this._connection.createStatement( "INSERT INTO `clients`(`name`, `default_hour_price`) VALUES(:name, :default_hour_price)" );
		statement.params.name = name;
		statement.params.default_hour_price = defaultHourPrice;
		
		statement.executeAsync({
			
			handleCompletion: function( aReason ){
				if (aReason == Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED){ 

					jobmanagerDB._callbackCall( callback );
					jobmanagerDB._observer.notifyObservers( null, "JM:clientAdded", jobmanagerDB._connection.lastInsertRowID );						
				
				}  
			}

		});
	},
	
	getClient: function( id, callback ){
		var statement = this._connection.createStatement( "SELECT `rowid`, `name`, `default_hour_price` FROM `clients` WHERE `rowid` = :id" );
		statement.params.id = id;
		
		statement.executeAsync({			
			handleResult: function( aResultSet ){
				for( var row = aResultSet.getNextRow(); row; row = aResultSet.getNextRow() ){
					jobmanagerDB._callbackCall( callback, [{
						id: row.getResultByName("rowid"),
						name: row.getResultByName("name"),
						defaultHourPrice: row.getResultByName("default_hour_price")
					}] );
					break;
				}
			},
			
			handleCompletion: function( aReason ){
				if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED){ 
					jobmanagerDB._callbackCall( callback, [null] );
				}  
			}
		});

	},
	
	editClient: function( clientId, name, defaultHourPrice, callback ){
		var statement = this._connection.createStatement( "UPDATE `clients` SET `name` = :name, `default_hour_price` = :default_hour_price WHERE rowid = :client_id" );
		statement.params.name = name;
		statement.params.default_hour_price = defaultHourPrice;
		statement.params.client_id = clientId;
		
		statement.executeAsync({
			handleCompletion: function( aReason ){
				if (aReason == Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED){ 
					jobmanagerDB._callbackCall( callback, [null] );
					jobmanagerDB._observer.notifyObservers( null, "JM:clientUpdated", clientId );
				}  
			}
		});
		
		
	},
	
	clientExistsByName: function( name, callback ){
		var statement = this._connection.createStatement( "SELECT `rowid` FROM `clients` WHERE `name` = :name" );
		statement.params.name = name;
		
		statement.executeAsync({
			id: 0,
			
			handleResult: function( aResultSet ){				
				for( var row = aResultSet.getNextRow(); row; row = aResultSet.getNextRow() ){
					this.id = row.getResultByName( "rowid" );
					break;
				}				
			},
			
			handleCompletion: function( aReason ){
				if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED){ 
					jobmanagerDB._callbackCall( callback, [null] );
				}  
				else{
					jobmanagerDB._callbackCall( callback, [this.id] );
				}
			}
		});
	},
	
	deleteClient: function( clientId ){
		var statement = this._connection.createStatement( "DELETE FROM `clients` WHERE rowid = :client_id" );
		statement.params.client_id = clientId;
		
		statement.executeAsync({
			handleCompletion: function( aReason ){
				if (aReason == Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED){ 
					jobmanagerDB._observer.notifyObservers( null, "JM:clientRemoved", clientId );
				}  
			}
		});	
	},
	
	listClients: function( callback ){
		var statement = this._connection.createStatement( "SELECT `rowid`, `name`, `default_hour_price` FROM `clients`" );
		
		statement.executeAsync({
			clients: [],
			
			handleResult: function( aResultSet ){				
				for( var row = aResultSet.getNextRow(); row; row = aResultSet.getNextRow() ){
	
					this.clients.push({
						id: row.getResultByName("rowid"),
						name: row.getResultByName("name"),
						defaultHourPrice: row.getResultByName("default_hour_price")
					});
	
				}
			},
			
			handleCompletion: function( aReason ){
				if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED){ 
					jobmanagerDB._callbackCall( callback, [null] );
				}  
				else{
					jobmanagerDB._callbackCall( callback, [this.clients] );
				}
			}
		});

	},
	
	/* Job functions */
	
	addJob: function( clientId, description, hourPrice ){		
		var statement = this._connection.createStatement( "INSERT INTO `jobs` (`start_date`, `description`, `hour_price`, `client_id`, `status`, `end_date`) VALUES(:now, :description, :hour_price, :client_id, 'started', NULL)" );
		statement.params.now = this._nowTime();				
		statement.params.description = description;
		statement.params.hour_price = hourPrice;
		statement.params.client_id = clientId;		
		statement.executeAsync({
			handleCompletion: function( aReason ){
				if (aReason == Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED){ 
					jobmanagerDB._observer.notifyObservers( null, "JM:jobAdded", jobmanagerDB._connection.lastInsertRowID );
				}  	
			}
		});
		
		
	},
	
	getJobElapsedTime: function( jobId, callback ){
		var statement = this._connection.createStatement( "SELECT `start_date`, `end_date` FROM `jobs_periods` WHERE `job_id` = :job_id" );
		
		statement.params.job_id = jobId;
		
		statement.executeAsync( {
			time: 0,
			
			handleResult: function( aResultSet ){				
				for( var row = aResultSet.getNextRow(); row; row = aResultSet.getNextRow() ){	
					var startTime = row.getResultByName("start_date");
					var endTime = row.getResultByName("end_date");		
			
					if( !endTime ){
						endTime = new Date().getTime();
					}
					else{
						endTime = jobmanagerDB._parseDate( endTime );
					}
							
					this.time += Math.round((endTime - jobmanagerDB._parseDate( startTime ))/1000);	
				}
				
				//dump( (this.time / 60) + "\n" );
			},
			
			handleCompletion: function( aReason ){
				if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED){ 
					jobmanagerDB._callbackCall( callback, [null] );
				}
				else{
					jobmanagerDB._callbackCall( callback, [ jobmanagerDB._prepareTime( Math.round(this.time/60) ) ] );
				}
			}
		} );
		

	},
	
	getJobEarnings: function( id, callback_getJobEarnings ){		

		this.getJobElapsedTime( id, {
			func: function( elapsed ){
				if( elapsed == null ){
					jobmanagerDB._callbackCall( callback_getJobEarnings, [0] );
				}
				else{
					var tmp = elapsed.split( ":" );	
					
					var hours = parseInt(tmp[0], 10) + tmp[1]/60; 

					this.getJob(id, {
						func: function( job ){
							if( job != null ){
								var earned = Math.round( hours * job.hourPrice * 100 ) / 100;
								jobmanagerDB._callbackCall( callback_getJobEarnings, [earned] );
							}
						}
					});	
				}
			}
		} );			
	
	},
	
	getJobsInYear: function( year, callback ){
		
		var startDate = year + "-01-01";
		var endDate = year + "-12-31";
		
		var whereStr = "WHERE `start_date` BETWEEN '"+startDate+"' AND '"+endDate+"' AND `status` = 'finished'";
		
		this.listJobs( whereStr, callback );
		
	},
	
	activeJobsTotalEarning: function( callback ){			
		this.listJobs(" WHERE `status` = 'started' ", {
			func: function( jobs ){
				
				if( jobs == null || jobs.length == 0 ){
					jobmanagerDB._callbackCall( callback, [0] );
				}
				else{
					
					var earnings = 0;

					
					for( var i = 0; i != jobs.length; i++ ){
		
						(function( jobs, i ){

							jobmanagerDB.getJobEarnings( jobs[i].id, {
								func: function( jobEarnings ){
									earnings += jobEarnings;
											
									if( i == jobs.length - 1 ){
										jobmanagerDB._callbackCall( callback, [earnings] );
									}
								}
							} );							
							
						})( jobs, i );

					}
					
				}
			}
		});

	},
	
	jobNamesUnique: function( maxCount, callback ){
		
		var statement = this._connection.createStatement( "SELECT `description` FROM `jobs` GROUP BY `description` ORDER BY `rowid` DESC LIMIT " + maxCount );
		
		statement.executeAsync( {
			jobs: [],
			
			handleResult: function( aResultSet ){				
				for( var row = aResultSet.getNextRow(); row; row = aResultSet.getNextRow() ){	
					this.jobs.push( row.getResultByName("description") );
				}
			},
			
			handleCompletion: function( aReason ){
				if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED){ 
					jobmanagerDB._callbackCall( callback, [null] );
				}
				else{
					jobmanagerDB._callbackCall( callback, [ this.jobs ] );
				}
			}
			
		} );
		
	},
	
	listJobs: function( whereString, callback ){
		
		whereString = whereString || "";
		
		var statement = this._connection.createStatement( "SELECT `start_date`, `description`, `hour_price`, `client_id`, `status`, `end_date`, `rowid` FROM `jobs` " + whereString );
		
		statement.executeAsync( {
			jobs: [],
			
			handleResult: function( aResultSet ){				
				for( var row = aResultSet.getNextRow(); row; row = aResultSet.getNextRow() ){	
					this.jobs.push( {
						id: row.getResultByName("rowid"),
						startDate: row.getResultByName("start_date"),
						description: row.getResultByName("description"),
						hourPrice: row.getResultByName("hour_price"),
						clientId: row.getResultByName("client_id"),
						status: row.getResultByName("status"),
						endDate: row.getResultByName("end_date")				
					} );
				}
			},
			
			handleCompletion: function( aReason ){
				if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED){ 
					jobmanagerDB._callbackCall( callback, [null] );
				}
				else{
					jobmanagerDB._callbackCall( callback, [ this.jobs ] );
				}
			}
		} );

	},
	
	getJob: function( id, callback ){
		var statement = this._connection.createStatement( "SELECT `start_date`, `description`, `hour_price`, `client_id`, `status`, `end_date` FROM `jobs` WHERE `rowid` = :id" );
		statement.params.id = id;
		
		statement.executeAsync({
			job: null,
			
			handleResult: function( aResultSet ){				
				for( var row = aResultSet.getNextRow(); row; row = aResultSet.getNextRow() ){	
					this.job = {
						startDate: row.getResultByName("start_date"),
						description: row.getResultByName("description"),
						hourPrice: row.getResultByName("hour_price"),
						clientId: row.getResultByName("client_id"),
						status: row.getResultByName("status"),
						endDate: row.getResultByName("end_date")				
					};
				}
			},
			
			handleCompletion: function( aReason ){
				if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED){ 
					jobmanagerDB._callbackCall( callback, [null] );
				}
				else{
					jobmanagerDB._callbackCall( callback, [ this.job ] );
				}
			}
		});

	},
	
	editJob: function( jobId, data, callback ){		
		var query = "UPDATE `jobs` SET";
		
		var setFields = [];
		for( var k in data ){
			setFields.push( "`"+k+"` = :"+k );
		}
		query = query + " " + setFields.join( "," );
		query = query + " WHERE rowid = :job_id";	
				
		var statement = this._connection.createStatement( query );
		
		for( var k in data ){
			statement.params[k] = data[k];
		}
		
		statement.params.job_id = jobId;
		
		statement.executeAsync({			
			handleCompletion: function( aReason ){
				if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED){ 					
					jobmanagerDB._callbackCall( callback, [ false ] );
				}
				else{
					jobmanagerDB._callbackCall( callback, [ true ] );
					jobmanagerDB._observer.notifyObservers( null, "JM:jobUpdated", jobId );
				}
			}
		});
		
		
	},
		
	pauseJob: function( jobId ){
		// finish all job periods
		this._finishUnfinishedJobPeriods( jobId );
		this.editJob( jobId, {
			"status": "paused"
		} );		
	},
	
	startJob: function( jobId ){
		// finish unfinished periods
		this._finishUnfinishedJobPeriods( jobId, {
			func: function(){
				// and start new period
				this._startJobPeriod( jobId, {
					func: function(){
						this.editJob( jobId, {
							"status": "started"
						} );		
					}
				} );
			}
		} );

	},
	
	endJob: function( jobId, callback ){
		var statement = this._connection.createStatement( "UPDATE `jobs` SET `end_date` = :now WHERE rowid = :job_id" );
		statement.params.job_id = jobId;
		statement.params.now = this._nowTime();
		statement.executeAsync({
			handleCompletion: function( aReason ){
				if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED){ 					
					jobmanagerDB._callbackCall( callback, [ false ] );
				}
				else{
					// finish all job periods
					jobmanagerDB._finishUnfinishedJobPeriods( jobId, {
						func: function(){
							this.editJob( jobId, {
								"status": "finished"
							}, {
								func: function(){
									jobmanagerDB._callbackCall( callback, [ true ] );
								}
							} );								
						}
					} );
				}
			}
		});
		

		

	},
	
	deleteJob: function( jobId, callback ){
		var statements = [];
				
		var statement = this._connection.createStatement( "DELETE FROM `jobs` WHERE `rowid` = :job_id" );
		statement.params.job_id = jobId;
		statements.push( statement );
		
		// remove periods
		var statement = this._connection.createStatement( "DELETE FROM `jobs_periods` WHERE `job_id` = :job_id" );
		statement.params.job_id = jobId;
		statements.push( statement );
		
		this._connection.executeAsync( statements, statements.length, {
			handleCompletion: function( aReason ){
				if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED){ 					
					jobmanagerDB._callbackCall( callback, [ false ] );
				}
				else{
					jobmanagerDB._callbackCall( callback, [ true ] );
					jobmanagerDB._observer.notifyObservers( null, "JM:jobRemoved", jobId );
				}
			}
		} );
	},
	
	_finishUnfinishedJobPeriods: function( jobId, callback ){
		try{
			var statement = this._connection.createStatement( "UPDATE `jobs_periods` SET `end_date` = :now WHERE `job_id` = :job_id AND `end_date` IS NULL" );
			statement.params.now = this._nowTime();			
			statement.params.job_id = jobId;
			statement.executeAsync({
				handleCompletion: function( aReason ){
					if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED){ 					
						jobmanagerDB._callbackCall( callback, [ false ] );
					}
					else{
						jobmanagerDB._callbackCall( callback, [ true ] );
					}
				}
			});
		}
		catch( ex ){
			
		}
	},
	
	_startJobPeriod: function( jobId, callback ){
		var statement = this._connection.createStatement( "INSERT INTO `jobs_periods` (`start_date`, `job_id`) VALUES(:now, :job_id)" );
		statement.params.job_id = jobId;
		statement.params.now = this._nowTime();
		
		statement.executeAsync({
			handleCompletion: function( aReason ){
				if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED){ 					
					jobmanagerDB._callbackCall( callback, [ null ] );
				}
				else{
					jobmanagerDB._callbackCall( callback, [ jobmanagerDB._connection.lastInsertRowID ] );
				}
			}
		});
		
	},
	
	_endJobPeriod: function( periodId, callback ){
		var statement = this._connection.createStatement( "INSERT INTO `jobs_periods` SET `end_date` = :end_date WHERE `rowid` = :period_id" );
		statement.params.period_id = periodId;

		statement.executeAsync({
			handleCompletion: function( aReason ){
				if (aReason != Components.interfaces.mozIStorageStatementCallback.REASON_FINISHED){ 					
					jobmanagerDB._callbackCall( callback, [ false ] );
				}
				else{
					jobmanagerDB._callbackCall( callback, [ true ] );
				}
			}
		});
	},
	
	_prepareTime: function( minutes ){
		//dump( "On input: " + minutes + "\r\n" );
		
		var hours = Math.floor(minutes / 60);
		minutes = minutes - hours * 60;
		
		var hoursString = hours.toString();
		var minutesString = minutes.toString();
		
		
		if( hoursString.length < 2 ){
			hoursString = "0" + hoursString;
		}
		if( minutesString.length < 2 ){
			minutesString = "0" + minutesString;
		}
		

		
		return hoursString + ":" + minutesString;
	},
	
	
	_addZero: function( v ){
		v = v + "";
		if( v.length == 1 ){
			v = "0"+v;
		}
		return v;
	},
	
	// return now time in mysql format
	_nowTime: function(){
		var d = new Date();
		
		return d.getFullYear() + "-" + this._addZero((d.getMonth()+1)) + "-" + this._addZero(d.getDate()) + " " + this._addZero(d.getHours()) + ":" + this._addZero(d.getMinutes()) + ":" + this._addZero(d.getSeconds());
	},
	
	_parseDate: function( dateString ){
		try{
			var tmp = dateString.split( " " );
			var year = 0;
			var month = 0;
			var day = 0;
			var hour = 0;
			var minute = 0;
			var second = 0;
			
			var date = tmp[0].split( "-" );
			year = date[0];
			month = date[1];
			day = date[2];
			
			if( tmp.length > 1 ){
				var time = tmp[1].split(":");
				hour = time[0];
				minute = time[1];			
				second = time[2];				
			}
			
			var res = new Date( year, month-1, day, hour, minute, second );
			
			//dump( dateString + " => " + res + "("+(new Date(res).toUTCString())+")\r\n" );
			
			return res;
		}
		catch( ex ){
			return 0;
		}
	},
	
	//privates
	_createTables: function(){
		var statements = [];
		
		if( !this._connection.tableExists("jobs") ){
			statements.push( this._connection.createStatement("CREATE TABLE `jobs` (\
			`start_date` DATE NOT NULL ,\
			`end_date` DATE NULL ,\
			`client_id` INT NOT NULL,\
			`hour_price` REAL NOT NULL,\
			`description` TEXT NOT NULL,\
			`status` TEXT NOT NULL\
			);\
			") );
		}
		
		if( !this._connection.tableExists("jobs_periods") ){
			statements.push( this._connection.createStatement("CREATE TABLE `jobs_periods` (\
			`start_date` DATE NOT NULL ,\
			`end_date` DATE NULL ,\
			`job_id` INT NOT NULL\
			);\
			") );
		}
		
		if( !this._connection.tableExists("clients") ){
			statements.push( this._connection.createStatement( "CREATE TABLE `clients` (\
			`name` DATE NOT NULL ,\
			`default_hour_price` REAL NOT NULL\
			);\
			" ) );
		}
		
		if( statements.length > 0 ){
			this._connection.executeAsync( statements, statements.length );
		}
	},
	
	_callbackCall: function( callback, arguments ){
		if( !callback ){
			return false;
		}
		
		if( typeof callback == "function" ){
			callback.apply(this, arguments);
			return;
		}
		
		arguments = arguments || [];
		
		if( callback.args ){
			arguments = arguments.concat( callback.args );
		}
		
		if( callback.inst ){			
			callback.func.apply( callback.inst, arguments );
		}
		else{
			callback.func.apply( this, arguments );
		}
		

		
		return true;
	}	
}
