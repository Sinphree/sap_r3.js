function jsPad(strInput)
{
	var strResult;
	strResult = strInput + "               ";
	strResult = strResult.substring(0,16);
	return(strResult);    
}
function jsTrim(strInput)
{
	var strResult;
	var objRegex = new RegExp("(^s+)|(s+$)");
	strResult    = strInput.replace(objRegex, "");
	return(strResult);
}

// Return date as yyyymmdd
function formatSAPdate()
{
//	var sDate;
//	sDate = lpad(day(date()),2) & "-" & lpad(month(date()),2) & "-" & year(date());
//	return(year(date()) & mid(sDate,4,2) & mid(sdate,1,2));
	return("20110609");
}

function lpad(pIn,pLen)
{
  var sData;
  sData = "00000000" + pIn;
  return(sData.right(pLen));
}
