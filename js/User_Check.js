//  Option Explicit
  var pernr;
  var userid;
  var plans;
  var sWhere;
  
//' Get Userid and or employee number parameters
  if(WScript.Arguments.length == 0) {
    WScript.echo("At least one argumernt");
  }
  userid = WScript.Arguments(0).toUpperCase();
  if(WScript.Arguments.length > 1) { 
    pernr = lPad(WScript.Arguments(1),8);
  } else {
    pernr = "00000000";
  }	
  
  var wDate = new Date();
  var sDate = wDate.getYear() + "" + lPad(wDate.getMonth()+1,2) + "" + lPad(wDate.getDate(),2);
  var sqlDates = "BEGDA <= '" + sDate + "' AND ENDDA >= '" + sDate + "'";
  
// Connect to SAP
  var R3 = new SAP_R3();
//  R3.Connect('saprp100.cmltd.net.au','400',0,'GZJJ2D','srssun05');
//  R3.Connect(R3Info.RP1.server,R3Info.RP1.client,R3Info.RP1.sysnum,R3Info.RP1.userid,R3Info.RP1.passwrd);
  if( R3.Connect(R3Info.RP1) == false ) {
    WScript.echo("Error logging on!");
	WScript.quit(1);
  }
  
  WScript.echo();
  
// If the Userid was passed in the turn it into the Employee Number
  if (pernr == null | pernr == "" | pernr == "00000000") {
	sWhere = "SUBTY = '0001' AND USRID = '" + userid + "'";
    sWhere += " AND " + sqlDates;	   
    rsPA0105 = R3.Read("PA0105", sWhere, "PERNR");
    for (var enumerator = new Enumerator(rsPA0105.Rows) ; !enumerator.atEnd(); enumerator.moveNext())
	{
		var Row = enumerator.item();
//		pernr = Row(1);
        pernr = R3.GetData("PERNR",Row(1)); 
	}
    WScript.echo("Pernr is " + pernr);
  }	

// If the Userid was passed in the turn it into the Employee Number
  if (userid == '?') {
	sWhere = "PERNR = '" + pernr + "' AND SUBTY = '0001'";
    sWhere += " AND " + sqlDates;	   
    rsPA0105 = R3.Read("PA0105", sWhere, "USRID");
    for (var enumerator = new Enumerator(rsPA0105.Rows) ; !enumerator.atEnd(); enumerator.moveNext())
	{
		var Row = enumerator.item();
		userid = R3.GetData("USRID",Row(1));
	}
    WScript.echo("Userid is " + userid);
  }	

  if (pernr == "" | pernr == "00000000") {
    WScript.echo("Pernr not found");
    WScript.quit(1);  
  }
  var ename = "placeholder";
// Now get the employees position number
  sWhere = "PERNR = '" + pernr + "' AND " + sqlDates;
  rsPA0001 = R3.Read("PA0001", sWhere, "PLANS,ENAME");
  for (var enumerator = new Enumerator(rsPA0001.Rows) ; !enumerator.atEnd(); enumerator.moveNext())
  {
	var Row = enumerator.item();
	plans = R3.GetData("PLANS",Row(1));
	ename = R3.GetData("ENAME",Row(1));
  }
  if( plans == null ) {
    WScript.echo("Pernr " + pernr + " not found");
    WScript.quit(1);  
  }
  
  WScript.echo("Name is " + ename);
  WScript.echo("Position# is " + plans);

// Get email address from it0105 and user master  
  var User_Dets = R3.User_Detail(userid);
  var objAddress1 = User_Dets.imports('ADDRESS');
  WScript.echo("Email from User Master is " + objAddress1("E_MAIL"));

  sWhere = "PERNR = '" + pernr + "' AND SUBTY = '0010'";
  sWhere += " AND " + sqlDates;	   
  rsPA0105 = R3.Read("PA0105", sWhere, "USRID_LONG");
  for (var enumerator = new Enumerator(rsPA0105.Rows) ; !enumerator.atEnd(); enumerator.moveNext())
  {
	var Row = enumerator.item();
	WScript.echo("Email from IT0105/0010 is " + R3.GetData("USRID_LONG",Row(1)));
  }

// Now get the Roles from the position

  WScript.echo();
  WScript.echo("Roles...");
  WScript.echo();

  sWhere =  "OTYPE = 'S'";
  sWhere += " AND OBJID = '" + plans + "'";
  sWhere += " AND RSIGN = 'B'";
  sWhere += " AND RELAT = '007'";
  sWhere += " AND SCLAS = 'AG'"
  sWhere += " AND " + sqlDates;
  var rsRoles = R3.Read("HRP1001", sWhere, "SOBID");
  for (var enumerator = new Enumerator(rsRoles.Rows) ; !enumerator.atEnd(); enumerator.moveNext())
  {
	var Row = enumerator.item();
	WScript.echo(R3.GetData("SOBID",Row(1)));
  }
  
// Now get the Manager from the position
  WScript.echo();
  WScript.echo("Manager Of...");
  WScript.echo();

  sWhere =  "OTYPE = 'S'";
  sWhere += " AND OBJID = '" + plans + "'";
  sWhere += " AND RSIGN = 'A'";
  sWhere += " AND RELAT = '012'";
  sWhere += " AND SCLAS = 'O'"
  sWhere += " AND " + sqlDates;
  var rsRoles = R3.Read("HRP1001", sWhere, "SOBID");
  for (var enumerator = new Enumerator(rsRoles.Rows) ; !enumerator.atEnd(); enumerator.moveNext())
  {
	var Row = enumerator.item();
//	WScript.echo(R3.GetData("SOBID",Row(1)));
	orgName(R3.GetData("SOBID",Row(1)));
  }
  
// Now get the Admin Relationships from the position
  WScript.echo();
  WScript.echo("Admin Of...");
  WScript.echo();

  sWhere =  "OTYPE = 'S'";
  sWhere += " AND OBJID = '" + plans + "'";
  sWhere += " AND RSIGN = 'B'";
  sWhere += " AND RELAT = '290'";
  sWhere += " AND SCLAS = 'O'"
  sWhere += " AND " + sqlDates;
  var rsRoles = R3.Fetch("HRP1001", sWhere, "SOBID");
  
//  var holdFields = R3.GetFieldDefs();
  
  for (var enumerator = new Enumerator(rsRoles.tables('DATA').Rows) ; !enumerator.atEnd(); enumerator.moveNext())
  {
	var Row = enumerator.item();
	WScript.echo(R3.GetField(rsRoles,"SOBID",Row(1)));
//	WScript.echo(R3.GetData("SOBID",Row(1)));
//	orgName(R3.GetField(rsRoles,"SOBID",Row(1)));
//    R3.SetFieldDefs(holdFields); 
//	orgName(R3.GetData("SOBID",Row(1)));
  }

  //  var rsRoles = R3.Read("HRP1001", sWhere, "SOBID");
  
//  var holdFields = R3.GetFieldDefs();
  
//  for (var enumerator = new Enumerator(rsRoles.Rows) ; !enumerator.atEnd(); enumerator.moveNext())
//  {
//	var Row = enumerator.item();
//	WScript.echo(R3.GetData("SOBID",Row(1)));
////    R3.SetFieldDefs(holdFields); 
////	orgName(R3.GetData("SOBID",Row(1)));
//  }

  
  
// Now get the Substitutions
  WScript.echo("==========Substitute of...==========");
  sWhere =  "OTYPE = 'S'";
  sWhere += " AND OBJID = '" + plans + "'";
  sWhere += " AND RSIGN = 'B' AND RELAT = '210'";
  sWhere += " AND " + sqlDates;
  var rsRoles = R3.Read("HRP1001", sWhere, "SOBID");
  for (var enumerator = new Enumerator(rsRoles.Rows) ; !enumerator.atEnd(); enumerator.moveNext())
  {
	var Row = enumerator.item();
    holders(R3.GetData("SOBID",Row(1)));
  }
  
  WScript.echo("==========Substituted by...==========");
  sWhere =  "OTYPE = 'S'";
  sWhere += " AND OBJID = '" + plans + "'";
  sWhere += " AND RSIGN = 'A' AND RELAT = '210'";
  sWhere += " AND " + sqlDates;
  var rsRoles = R3.Read("HRP1001", sWhere, "SOBID");
  for (var enumerator = new Enumerator(rsRoles.Rows) ; !enumerator.atEnd(); enumerator.moveNext())
  {
	var Row = enumerator.item();
    holders(R3.GetData("SOBID",Row(1)));
  }

function lPad(inString,inLen) {
  var work = "x00000000" + inString;
  var wLen = work.length - inLen;
  return work.substr(wLen,inLen);
}

function holders(inPlans) {
  var wString;
  var sWhere =  "OTYPE = 'S'";
  sWhere += " AND OBJID = '" + inPlans + "'";
  sWhere += " AND RSIGN = 'A'";
  sWhere += " AND RELAT = '008'";
  sWhere += " AND SCLAS = 'P'"
  sWhere += " AND " + sqlDates;
  var rsHold = R3.Read("HRP1001", sWhere, "SOBID");
//  var tString; // = "Position " + inPlans;
  for (var enumerator = new Enumerator(rsHold.Rows) ; !enumerator.atEnd(); enumerator.moveNext())
  {
	var Row = enumerator.item();
	var temp = R3.GetData("SOBID",Row(1));
    if (wString == null) {
      wString = "Position " + inPlans + " Emp " + temp + " " + empName(temp);
	} else {
      wString += "\t\tEmp " + temp + " " + empName(temp);
    }
  }	
  WScript.echo(wString);
  return; // tString; 
}  

function orgName(inOrgeh) {
  var wString;
  var rsHold;
  var sWhere =  "OTYPE = 'O'";
  sWhere += " AND PLVAR = '01'";
  sWhere += " AND OBJID = '" + inOrgeh + "'";
  sWhere += " AND LANGU = 'E'";
  sWhere += " AND " + sqlDates;
  var rsHold = R3.Fetch("HRP1000", sWhere, "STEXT");
  for (var enumerator = new Enumerator(rsHold.tables('DATA').Rows) ; !enumerator.atEnd(); enumerator.moveNext())
  {
	var Row = enumerator.item();
	var temp = R3.GetField(rsHold,"STEXT",Row(1));
    wString = "Org Unit " + inOrgeh + " " + temp;
  }	
  WScript.echo(wString);
  return; // tString; 
}

function empName(inPernr) {
  var eName;
  var sWhere =  "PERNR = '" + inPernr + "'";
  sWhere += " AND " + sqlDates;
  var rsHold = R3.Read("PA0001", sWhere, "ENAME");
  for (var enumerator = new Enumerator(rsHold.Rows) ; !enumerator.atEnd(); enumerator.moveNext())
  {
	var Row = enumerator.item();
    eName = R3.GetData("ENAME",Row(1)); 
    break;
  }
//  WScript.echo(eName);
  return eName;
}