(function SAP_R3() {
// SAP_R3 is a Javascript class to access data in an SAP system
//
// Requires the jscript.string functions 
//	
// Global data - Connection and Function Module Interface 
	this.objFunctions = new ActiveXObject("SAP.Functions");
	this.objConn 	  = this.objFunctions.Connection();
	this.objConn.ApplicationServer = "";
	this.objConn.Client            = "";
	this.objConn.SystemNumber      = 0;
	this.objConn.User              = "";
	this.objConn.Password          = "";
//  Global data - Other things
	this.objFields = null;
	
// Connect to the specified SAP system/Client
	this.Connect = function() {
	    if (arguments.length == 1) {
// Option 1 - Use a R3_Info object from a JSON file
		  this.objConn.ApplicationServer = arguments[0].server;
		  this.objConn.Client = arguments[0].client;
		  this.objConn.SystemNumber = arguments[0].sysnum;
		  this.objConn.User = arguments[0].userid;
		  this.objConn.Password = arguments[0].passwrd;		  
		} else {
// Option 2 - Pass server parameters  Connect(server,client,sysNum,user,password)	
		  this.objConn.ApplicationServer = arguments[0];
		  this.objConn.Client = arguments[1];
		  this.objConn.SystemNumber = arguments[2];
		  this.objConn.User = arguments[3];
		  this.objConn.Password = arguments[4];
		}	
		if (!this.objConn.logon(0,true))
		{
			return false;
		}
		return true;	
	}

// Read a table into an object - Obsolete - use Fetch instead
	this.Read = function(inTable, inWhere, inFields) {
// The problem is that this can't be called in nested way (maybe sometime I can fix this)	
		var i, j;
//      Clear the function module interface and set up RFC_READ_TABLE		
		this.objFunctions.RemoveAll();
		this.objReadTable = this.objFunctions.Add('RFC_READ_TABLE');
//		Name the table to read
		var objTable = this.objReadTable.exports('QUERY_TABLE');
		objTable.Value = inTable;
//		Select Where clause  
		var objOptions = this.objReadTable.tables('OPTIONS');
		var aryOptions = jscript.string.breakLine(inWhere,72);
	    if (typeof(aryOptions) == "string") { 
			objOptions.Rows.Add();
			objOptions(1, "TEXT") = inWhere;
		} else {
			for (i = 0; i < aryOptions.length; i++) {
				j = i + 1;
				objOptions.Rows.Add();
				objOptions(j, "TEXT") = aryOptions[i];
			}
		}
//		List of fields to read
		this.objFields = this.objReadTable.tables("FIELDS");
		var aryFields = jscript.string.stripChars(inFields,"strip"," ").split(",");
		for (i = 0; i < aryFields.length; i++) {
			j = i + 1;
			this.objFields.Rows.Add();
			this.objFields(j, "FIELDNAME") = aryFields[i];
		}
//		Table object to recieve data into 
		var objData = this.objReadTable.tables('DATA');
//		Invoke the function module 
		this.objReadTable.call();
//		Return the DATA object to the caller 		
		return objData;	
	}

// Read a table into an array of objects (fields are properties of the object)	
	this.Fetch = function(inTable, inWhere, inFields) {
		var i, j;
// Clear the function module interface and set up RFC_READ_TABLE		
		this.objFunctions.RemoveAll();
		this.objReadTable = this.objFunctions.Add('RFC_READ_TABLE');
// Input - Name of Table to read
		var objTable = this.objReadTable.exports('QUERY_TABLE');
		objTable.Value = inTable;
// Input - Where clause of selection
		var objOptions = this.objReadTable.tables('OPTIONS');
		var aryOptions = jscript.string.breakLine(inWhere,72);
	    if (typeof(aryOptions) == "string") { 
			objOptions.Rows.Add();
			objOptions(1, "TEXT") = inWhere;
		} else {
			for (i = 0; i < aryOptions.length; i++) {
				j = i + 1;
				objOptions.Rows.Add();
				objOptions(j, "TEXT") = aryOptions[i];
			}
		}
// Input - Fields to return
		this.objFields = this.objReadTable.tables("FIELDS");
		var aryFields = jscript.string.stripChars(inFields,"strip"," ").split(",");
		for (i = 0; i < aryFields.length; i++) {
			j = i + 1;
			this.objFields.Rows.Add();
			this.objFields(j, "FIELDNAME") = aryFields[i];
		}
// Output - Data from the function		
		var objData = this.objReadTable.tables('DATA');
// Invoke function
		this.objReadTable.call();
// Split up returned data and store in the array
		var oRow;
		var oFieldName;
		var oFieldValue;
		var aryData = [];
		for (oRow = new Enumerator(objData.Rows); !oRow.atEnd(); oRow.moveNext())
		{
			var oRowData = new Object;
			tValue = oRow.item();
			for (oField = new Enumerator(this.objReadTable.tables('FIELDS').Rows); !oField.atEnd(); oField.moveNext())
			{
				var temp = oField.item();
				oFieldName = temp("FIELDNAME").toLowerCase();
				oFieldValue = tValue(1).substr(temp("OFFSET"),temp("LENGTH"));
				oRowData[oFieldName] = oFieldValue;
			}
			aryData.push(oRowData);
		}		
		return aryData;	
	}

// Return a single field - Might be obsolete	
	this.GetField = function(inTable,inField,dataLine) {

		var oField;
		var sData;
		for (oField = new Enumerator(inTable.tables('FIELDS').Rows); !oField.atEnd(); oField.moveNext())
		{
			var temp = oField.item();
			if (temp("FIELDNAME") == inField)
			{ 
				sData = dataLine.substr(temp("OFFSET"),temp("LENGTH"));
				break;
			}
		}
		return(sData);
	}
	
	
	
//	this.GetFieldDefs = function() {
//		return this.objFields;
//	}
	
//	this.SetFieldDefs = function(inObjFields) {
//		this.objFields = inObjFields;
//	}
	
// 
	this.GetData = function(inField,dataLine) {
	
		var oField;
		var sData;
		for (oField = new Enumerator(this.objFields.Rows); !oField.atEnd(); oField.moveNext())
		{
			var temp = oField.item();
			if (temp("FIELDNAME") == inField)
			{ 
				sData = dataLine.substr(temp("OFFSET"),temp("LENGTH"));
				break;
			}
		}
		return(sData);
	}
	
// Convert a javascript date into an SAP date (yyyymmdd) 
	this.sapDate = function(inDate) {
		var now;
		if (inDate == null || inDate == "") {
			now = new Date();
		} else {
			now = inDate;
		}	
		var year  = now.getFullYear();
		var month = now.getMonth() + 1;
		var day   = now.getDate();
		if (month < 10) { 
			month = "0" + month;
		} else { 
			month = "" + month;
		}
		if (day   < 10) {
			day   = "0" + day;
		} else {
		    day = "" + day;
		}	
		return year + month + day;
	}

// Generic Auth Check
	this.Auth_Check = function(inUser,inObject,inField1,inValue1,inField2,inValue2,inField3,inValue3,inField4,inValue4,inField5,inValue5) {
		this.objAuth = this.objFunctions.Add('AUTHORITY_CHECK');
		
		var objObject1 = this.objAuth.exports('USER');
		objObject1.Value = inUser.toUpperCase();

		var objUser = this.objAuth.exports('OBJECT');
		objUser.Value = inObject.toUpperCase();

        if (inField1) {
			var objFld = this.objAuth.exports('FIELD1');
			objFld.Value = inField1;
			var objVal = this.objAuth.exports('VALUE1');
			objVal.Value = inValue1;
		}
        if (inField2) {
			var objFld = this.objAuth.exports('FIELD2');
			objFld.Value = inField2;
			var objVal = this.objAuth.exports('VALUE2');
			objVal.Value = inValue2;
		}
        if (inField3) {
			var objFld = this.objAuth.exports('FIELD3');
			objFld.Value = inField3;
			var objVal = this.objAuth.exports('VALUE3');
			objVal.Value = inValue3;
		}
        if (inField4) {
			var objFld = this.objAuth.exports('FIELD4');
			objFld.Value = inField4;
			var objVal = this.objAuth.exports('VALUE4');
			objVal.Value = inValue4;
		}
        if (inField5) {
			var objFld = this.objAuth.exports('FIELD5');
			objFld.Value = inField5;
			var objVal = this.objAuth.exports('VALUE5');
			objVal.Value = inValue5;
		}

		var result = this.objAuth.call();
		return this.objAuth.exception;
	}
	
// Check if a user can invoke a transaction?
	this.Txn_Check = function(inUser,inTxn) {
		return this.Auth_Check(inUser,"S_TCODE","TCD",inTxn);
//		this.objAuth = this.objFunctions.Add('AUTHORITY_CHECK');
//		
//		var objObject1 = this.objAuth.exports('USER');
//		objObject1.Value = inUser.toUpperCase();
//
//		var objUser = this.objAuth.exports('OBJECT');
//		objUser.Value = 'S_TCODE';
//
//		var objUser = this.objAuth.exports('FIELD1');
//		objUser.Value = 'TCD';
//		var objUser = this.objAuth.exports('VALUE1');
//		objUser.Value = inTxn.toUpperCase();
//		
//		var result = this.objAuth.call();
//		return this.objAuth.exception;
	}

// Return the auths a user has to a specific object 
	this.Auth_List = function(inUser,inObj) {
		this.objAuth = this.objFunctions.Add('SUSR_USER_AUTH_FOR_OBJ_GET');
		var objObject1 = this.objAuth.exports('USER_NAME');
		objObject1.Value = inUser.toUpperCase();
		var objUser = this.objAuth.exports('SEL_OBJECT');
		objUser.Value = inObj.toUpperCase();
		var objData = this.objAuth.tables('VALUES');
		var result = this.objAuth.call();
		return this.objAuth;
	}	
	
// Stub to get user details
	this.User_Detail = function(inUser) {
		this.objAuth = this.objFunctions.Add('BAPI_USER_GET_DETAIL');
		var objObject1 = this.objAuth.exports('USERNAME');
		objObject1.Value = inUser.toUpperCase();
		this.objAuth.call();
		return this.objAuth;
	}

//}
})();
