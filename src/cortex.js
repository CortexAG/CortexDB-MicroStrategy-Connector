/*
(function(){
  // mstr is a global object from mstrgdc-1.0.js, which represents the data connector framework
  var myConnector = mstr.createDataConnector();
  // Connector must define fetchTable function
  myConnector.fetchTable = function(table, params, doneCallback) {
    // params represents information sent by connector to MSTR at interactive phase
    var mstrObj = JSON.parse(params);
    var file = mstrObj.connectionData.file;
    var url = file;
    $.get(url, function(resp) {
      table.appendRawData(resp)
      doneCallback(table);
    });
  };
  // validateDataConnector does a validation check of the connector
  mstr.validateDataConnector(myConnector);
})();

// Create event listener for when the user submits the form

$(document).ready(function() {
  $("#submitButton").click(function() {
    var content = $("#file").val();
    mstr.connectionName = "RawDataFiles";
    // connectionData is a JSON object. Connector can put any information here.
    mstr.connectionData = {};
    mstr.connectionData.file = content;
    // MUST define tableList field. Can import multiple tables in one connection.
    mstr.tableList = [];
    mstr.tableList.push({tableName: "RawDataCsv"});

    // Inform that interactive phase is finished and send information to MSTR
    window.mstr.submit();
  });
});
*/

function parseResponse(response, tableData){

  //tableData = response.result.data.d;
  /*
  console.log('parseResponse');
  console.log(arguments);
  */

  /*
  resp = response.Search;
  for (i = 0, len = resp.length; i < len; i++) {
    tableData.push({
      "Title": resp[i].Title,
      "Year":parseInt(resp[i].Year),
      "imdbID":resp[i].imdbID,
      "Type":resp[i].Type,
      "Poster":resp[i].Poster
    });
  }
  */
  resp = response.result.data.d;
  for (i = 0, len = resp.length; i < len; i++) {
    tableData.push(JSON.parse(JSON.stringify(resp[i])));
  }

}

// Create the connector object
var myConnector = mstr.createDataConnector();
//console.log(myConnector);

var setTableSchema = function(tableSchema, aCfg){

  //console.log('setTableSchema');
  //console.log(arguments);

  var cols = [], b, t;
  for(var i=0; i<aCfg.length; i++)
  {
    b = {};
    b.name = aCfg[i]['h'];

    b.dataType = mstr.dataTypeEnum.string;
    if(aCfg[i]['t'] == 'N')
    {
      b.dataType = mstr.dataTypeEnum.int;
    }
    if(aCfg[i]['t'] == 'F')
    {
      b.dataType = mstr.dataTypeEnum.double;
    }

    if(aCfg[i]['t'] == 'D')
    {
      b.dataType = mstr.dataTypeEnum.date;
      b.dateFormat = 'yyyy-MM-dd';
    }
    /*
    if(aCfg[i]['t'] == 'T')
    {
      b.dataType = mstr.dataTypeEnum.datetime;
      b.dateFormat = 'yyyyMMddHHmm';
    }
    */

    cols.push(b);
  }

  tableSchema.column = cols;
}

/*
myConnector.init = function(table, params, doneCallback) {

  console.log('init');
  console.log(arguments);

  }
*/

// Download the data
myConnector.fetchTable = function(table, params, doneCallback) {

  // mstrObj represents all useful information that the connector saved before sumbit
  var mstrObj = JSON.parse(params);
  var dataObj = mstrObj.connectionData;
  var tableData=[];
  //var baseUrl = "http://192.168.21.3/mstr/uniplexdataservice/updjsr.php";
  //setTableSchema(table.tableSchema);

  $.ajax(g_sUrlDataService, {
                    'method'      : 'POST',
                    'data'        : JSON.stringify(dataObj),
                    'contentType' : 'application/json',
                    'processData' : false,
                    //'dataType'    : 'json'
                  }
        ).success(function(response) {

    //console.log(response);


    setTableSchema(table.tableSchema, response.result.data.hc);
    parseResponse(response, tableData);
    table.appendFormattedData(tableData);
    doneCallback(table);

  });
};

// validateDataConnector will do validation check of the connector
mstr.validateDataConnector(myConnector);

// Create event listeners for when the user submits the form
$(document).ready(function() {

  $("#submitButton").click(function() {
    var portal = $("#portal").val();
    var portalrow = $("#portalrow").val();

    //alert(portal + ':' + portalrow);

    var dataObj = {

      'method'    : 'getPortalRowDataList',
      'requestid' : 1,
      'param'     : {
                      'portaliid' : portal,
                      'rownr'     : portalrow,
                      'format'    : 'human',
                      'UpdJsrHdl' : g_sUpdJsrHdl
                    }
    };
    mstr.connectionData = dataObj;
    // This will be the data source name in mstr
    mstr.connectionName = "cortexdb";
    mstr.fileType = 'FORMAT_JSON';
    var params = {};
    mstr.connectionData = mstr.connectionData;
    mstr.authenticationInfo = "";
    mstr.authType = mstr.authTypeEnum.basic;
    mstr.tableList = [];
    mstr.tableList.push({tableName: "cortex"});
    //console.log(JSON.stringify(params));
    window.mstr.submit();
  });

  var bu = this.location.href;
  var bu1 = this.location.search;
  bu = bu.replace(bu1, "").split("/");
  var i, buff;
  buff = "";
  g_sUrlPre = '';
  for(i=0; i<bu.length-2; i++) {
    g_sUrlPre += bu[i] + "/"
  }
  g_sUrlDataService = g_sUrlPre + 'UniPlexDataservice/updjsr.php';
  console.log(g_sUrlDataService);

  $('#portal').on('change', function() {

    getPortalRows(this.value);
  });


  getLogin();


});

var g_sUrlPre = '';
var g_sUrlDataService = '';
var g_sUpdJsrHdl = '';

/////////////////////////////////////////////////////////////////////////////////
function getLogin() {

  var oRequest = {
    'method'    : 'getLogin',
    'requestid' : 1,
    'param'     : {
                    'user'      : 'admin',
                    'pass'      : 'admin',
                  }
  };

  $.ajax(g_sUrlDataService, {
    'method'      : 'POST',
    'data'        : JSON.stringify(oRequest),
    'contentType' : 'application/json',
    'processData' : false,
    //'dataType'    : 'json'
  }).success(function(response) {

    if(response['requesterror'] != 0) {
      console.log(response);
      return;
    }
    if(response['result']['rc'] != 0) {
      alert(response['result']['error']);
      console.log(response['result']);
      return;
    }

    console.log(response['result']['data']);
    g_sUpdJsrHdl = response['result']['data']['UpdJsrHdl'];

    getPortalList();
  });
}



/////////////////////////////////////////////////////////////////////////////////
function getPortalList() {

  var oRequest = {
    'method'    : 'getPortalList',
    'requestid' : 1,
    'param'     : {
                    'UpdJsrHdl' : g_sUpdJsrHdl
                  }
  };

  $.ajax(g_sUrlDataService, {
    'method'      : 'POST',
    'data'        : JSON.stringify(oRequest),
    'contentType' : 'application/json',
    'processData' : false,
    //'dataType'    : 'json'
  }).success(function(response) {

    if(response['result']['rc'] != 0) {
      alert(response['result']['error']);
      console.log(response['result']);
      return;
    }

    //console.log(response['result']['data']);

    $('#portal').append($('<option>', {value:'', text:'- Bitte wählen - '}));
    $.each(response['result']['data'], function (i, item) {
      $('#portal').append($('<option>', {
          value: item.i,
          text : item.n
      }));
  });

  });

}

/////////////////////////////////////////////////////////////////////////////////
function getPortalRows(sPortalIId) {

  var oRequest = {
    'method'    : 'getPortalRows',
    'requestid' : 1,
    'param'     : {
                    'portaliid' : sPortalIId,
                    'UpdJsrHdl' : g_sUpdJsrHdl
                  }
  };

  $.ajax(g_sUrlDataService, {
    'method'      : 'POST',
    'data'        : JSON.stringify(oRequest),
    'contentType' : 'application/json',
    'processData' : false,
    //'dataType'    : 'json'
  }).success(function(response) {

    if(response['result']['rc'] != 0) {
      alert(response['result']['error']);
      console.log(response['result']);
      return;
    }

    console.log(response['result']['data']);

    $('#portalrow').empty();

    $.each(response['result']['data']['g'], function (i, item) {
      var sGID = 'gid'+item.groupnr;
      $('#portalrow').append('<optgroup label="'+item.n+'" id="'+sGID+'"></optgroup>');

      $.each(item.z, function (z, entry) {
        $('#'+sGID).append($('<option>', {value: entry.rownr, text : entry.n }));
        });
    });


  });
}