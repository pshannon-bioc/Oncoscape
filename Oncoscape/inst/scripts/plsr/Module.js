var plsrXXX;
//----------------------------------------------------------------------------------------------------
var PLSRModule = (function () {

  var plsrDisplay;
  var d3plsrDisplay;

  var geneLoadings = [];
  var geneNames = [];
  var vectors = [];
  var vectorNames = [];

  var firstTime = true;
  var sendSelectionMenu;

      // these are reported by the server, from an inspection of the data
  var ageAtDxMin=0, ageAtDxMax=1000, survivalMin=0, survivalMax=1000;

      // 4 sliders and their readout
  var ageAtDxSlider, ageAtDxMinSliderReadout, ageAtDxMaxSliderReadout;
  var survivalSlider, survivalMinSliderReadout, survivalMaxSliderReadout;

      // the current values specifying the subsets
      // set as 1/3 from min and max initially, subsequently read
      // from the sliders
  var ageAtDxMinThreshold, ageAtDxMaxThreshold, survivalMinThreshold, survivalMaxThreshold;

  var calculateButton;
  var clearSelectionButton;
  var d3brush;
  var currentlySelectedRegion;
  var thisModuleName = "PLSR";
  var geneSetMenu;

  var thisModulesName = "PLSR";
  var thisModulesOutermostDiv = "plsrDiv";
  var testResultsOutputDiv;
  var currentAbsoluteMaxValue; // most recent max value, used for scaling

  var sendSelectionsMenuTitle = "Send selection...";
  var selectionDestinationsOfferedHere = ["PLSR (highlight)"];
 
  var expressionDataSetName = "";

//--------------------------------------------------------------------------------------------
function initializeUI () 
{
   plsrDisplay = $("#plsrDisplay");
   d3plsrDisplay = d3.select("#plsrDisplay");

   ageAtDxSlider = $("#plsrAgeAtDxSlider");
   ageAtDxMinSliderReadout = $("#plsrAgeAtDxMinSliderReadout");
   ageAtDxMaxSliderReadout = $("#plsrAgeAtDxMaxSliderReadout");

   survivalSlider = $("#plsrSurvivalSlider");
   survivalMinSliderReadout = $("#plsrSurvivalMinSliderReadout");
   survivalMaxSliderReadout = $("#plsrSurvivalMaxSliderReadout");

   calculateButton = $("#plsrCalculateButton");
   calculateButton.button();
   calculateButton.click(requestPLSRByOnsetAndSurvival);
   hub.disableButton(calculateButton);

   geneSetMenu = $("#plsrGeneSetSelector");

   clearSelectionButton = $("#plsrClearSelectionButton");
   clearSelectionButton.button();
   clearSelectionButton.click(clearSelection);


   sendSelectionMenu = hub.configureSendSelectionMenu("#plsrSendSelectionsMenu", 
                                                        selectionDestinationsOfferedHere,
                                                        sendSelections,
                                                        sendSelectionsMenuTitle);
   //hub.disableButton(sendSelectionMenu);
   setupSliders();

   testResultsOutputDiv = $("#plsrTestingOutputDiv");

   $(window).resize(handleWindowResize);
   handleWindowResize();
   hub.disableTab(thisModulesOutermostDiv)


} // initializeUI
//--------------------------------------------------------------------------------------------
function addGeneSetNamesToMenu (geneSetNames)
{
   geneSetMenu.empty();
   if(geneSetNames.length === 0) {
      return;
      }
      
   for(var i=0; i < geneSetNames.length; i++){
      optionMarkup = "<option>" + geneSetNames[i] + "</option>";
      geneSetMenu.append(optionMarkup);
      } // for i

} // addGeneSetNamesToMenu
//--------------------------------------------------------------------------------------------
function getAgeAtDxAndSurvivalInputRanges()
{
   msg = {cmd: "summarizePLSRPatientAttributes", callback: "handleAgeAtDxAndSurvivalRanges", 
          status: "request", payload: ["AgeDx", "Survival"]};

   hub.send(JSON.stringify(msg));

} // getAgeAtDxAndSurvivalInputRanges
//----------------------------------------------------------------------------------------------
function handleAgeAtDxAndSurvivalRanges(msg)
{
   console.log("=== Module.plsr, handleAgeAtDxAndSurvivalRanges");

   ageAtDxMin = Math.floor(msg.payload.AgeDx[0]/365.24);
   ageAtDxMax = Math.floor(msg.payload.AgeDx[4]/365.24);
   survivalMin = Math.floor(msg.payload.Survival[0]/365.24);
   survivalMax = Math.floor(msg.payload.Survival[4]/365.24);

   //ageAtDxMin = Math.floor(msg.payload.AgeDx[0])-1;
   //ageAtDxMax = Math.floor(msg.payload.AgeDx[4])+1;
   //survivalMin = Math.floor(msg.payload.Survival[0])-1;
   //survivalMax = Math.floor(msg.payload.Survival[4])+1;
   setupSliders();

     // now that sliders are set up, setup the geneSetName selector
   requestGeneSetNames();

} // handleAgeAtDxAndSurvivalRanges 
//--------------------------------------------------------------------------------------------------
function sendSelections()
{
  var destination = sendSelectionMenu.val();
  selectedIDs = identifyEntitiesInCurrentSelection();

  var cmd = "sendSelectionTo_" + destination;
  payload = {value: selectedIDs, count: selectedIDs.length, source: "plsr module"};
  var newMsg = {cmd: cmd,  callback: "", status: "request", payload: payload};

  sendSelectionMenu.val(sendSelectionsMenuTitle);

  hub.send(JSON.stringify(newMsg));

} // sendSelections
//--------------------------------------------------------------------------------------------------
function requestPLSRByOnsetAndSurvival()
{
  ageAtDxMinThreshold = Number(ageAtDxMinSliderReadout.val()) * 365.24;
  ageAtDxMaxThreshold = Number(ageAtDxMaxSliderReadout.val()) * 365.24;
  survivalMinThreshold = Number(survivalMinSliderReadout.val()) * 365.24; 
  survivalMaxThreshold = Number(survivalMaxSliderReadout.val()) * 365.24;

  var currentGeneSetName = geneSetMenu.val();

  factor1 = {name: "AgeDx", 
             low: ageAtDxMinThreshold, 
             high: ageAtDxMaxThreshold};

  factor2 = {name: "Survival", 
             low: survivalMinThreshold,
             high: survivalMaxThreshold};
  
  payload = {genes: currentGeneSetName, 
             factorCount: 2, 
             factors: [factor1, factor2]};
  
  msg = {cmd: "calculatePLSR", callback: "handlePlsrResults", status: "request", payload: payload};
  msg.json = JSON.stringify(msg);

  hub.send(msg.json);

}  // requestPLSRByOnsetAndSurvival
//--------------------------------------------------------------------------------------------------
function setupSliders()
{
   var ageAtDxSpan = ageAtDxMax - ageAtDxMin;
   var survivalSpan = survivalMax - survivalMin;

   ageAtDxMinThreshold = Math.floor(ageAtDxMin + (ageAtDxSpan/3));
   ageAtDxMaxThreshold = Math.floor(1 + ageAtDxMax - (ageAtDxSpan/3));
   survivalMinThreshold = Math.floor(survivalMin + (survivalSpan/3));
   survivalMaxThreshold = Math.floor(1 + survivalMax - (survivalSpan/3));
 
   ageAtDxSlider.slider({
      range: true,
      slide: function(event, ui) {
          if(ui.values[0] > ui.values[1]){
            return false;
         }          
         ageAtDxMin = Number(ui.values[0]);
         ageAtDxMinSliderReadout.text (ui.values[0]);
         ageAtDxMax = Number(ui.values[1]);
         ageAtDxMaxSliderReadout.text (ui.values[1]);
         },
      min: ageAtDxMin,
      max: ageAtDxMax,
      values: [ageAtDxMinThreshold.toFixed(0), ageAtDxMaxThreshold.toFixed(0)]
      });
     ageAtDxMinSliderReadout.text(ageAtDxMinThreshold);
     ageAtDxMaxSliderReadout.text(ageAtDxMaxThreshold);

   survivalSlider.slider({
      range: true,
      slide: function(event, ui) {
         if(ui.values[0] > ui.values[1]){
            return false;
         }          
         survivalMin = ui.values[0];
         survivalMinSliderReadout.text(survivalMin);
         survivalMax = ui.values[1];
         survivalMaxSliderReadout.text(survivalMax);
         },
      min: survivalMin,
      max: survivalMax,
      //step: 0.1,
      values: [survivalMinThreshold, survivalMaxThreshold]
      });
   survivalMinSliderReadout.text(survivalMinThreshold);
   survivalMaxSliderReadout.text(survivalMaxThreshold);

} // setupSliders
//--------------------------------------------------------------------------------------------------
function handlePlsrResults (msg)
{
   firstTime = false;
   if(msg.status == "error"){
      alert(msg.payload);
      return;
      }

   var payload = msg.payload;

   var absMaxValue = payload.maxValue;
   vectors = payload.vectors;
   vectorNames = payload.vectorNames;
   geneLoadings = payload.loadings;
   geneNames = payload.loadingNames;

   currentAbsoluteMaxValue = absMaxValue; // most recent max value, used for scaling

   svg = d3PlsrScatterPlot(geneLoadings, geneNames, vectors, vectorNames, absMaxValue);

} // handlePlsrResults
//--------------------------------------------------------------------------------------------
function d3PlotBrushReader () {

  currentlySelectedRegion = d3brush.extent();
  x0 = currentlySelectedRegion[0][0];
  x1 = currentlySelectedRegion[1][0];
  width = Math.abs(x0-x1);
  selectedIDs = identifyEntitiesInCurrentSelection();

  console.log("=== plsr d3PlotBrushReader");
  console.log("  selectedIDs: " + selectedIDs.length);
  console.log("   destinations: " + sendSelectionMenu.children().length);

  //hub.disableButton(sendSelectionMenu);

  //if(selectedIDs.length === 0) 
  //   hub.disableButton(sendSelectionMenu);
  //else{
  //   if(sendSelectionMenu.children().length > 1)  // always at least one entry, the menu title
  //    hub.disableButton(sendSelectionMenu);
  //  }

} // d3PlotBrushReader
//-------------------------------------------------------------------------------------------
function d3PlsrScatterPlot(genes, geneNames, vectors, vectorNames, absMaxValue)
{
   var padding = 70;
   var width = plsrDisplay.width();
   var height = plsrDisplay.height();

   d3plsrDisplay.select("#plsrSVG").remove();  // so that append("svg") is not cumulative

   geneDataset = genes;

   absMaxValue = 1.2 * absMaxValue;
   var negAbsMaxValue = -1.0 * absMaxValue;

   var xScale = d3.scale.linear()
                  .domain([negAbsMaxValue, absMaxValue])
                  .range([padding, width - padding * 2]);

   var yScale = d3.scale.linear()
                  .domain([negAbsMaxValue, absMaxValue])
                  .range([height - padding, padding]); // note inversion 

   var xAxis = d3.svg.axis()
                 .scale(xScale)
                 .orient("bottom")
                 .ticks(5);

   var yAxis = d3.svg.axis()
                 .scale(yScale)
                 .orient("left")
                 .ticks(5);

   d3brush = d3.svg.brush()
                   .x(xScale)
                   .y(yScale)
                   .on("brushend", d3PlotBrushReader);

   function transform(d) {
      return "translate(" + xScale(d.Comp1) + "," + yScale(d.Comp2) + ")";
      } //transform

   var assignColor = d3.scale.ordinal()
                             .domain(["gene",     "vector"])
                             .range (["gray",     "red"]);

   var svg = d3plsrDisplay.append("svg")
               .attr("id", "plsrSVG")
               .attr("width", width)
               .attr("height", height)
               .call(d3brush);
               //.append("g");
               //.attr("transform", "translate(" + padding + "," + padding + ")");

   var tooltip = d3plsrDisplay.append("div")
                              .attr("data-toggle", "tooltip")
                              .style("position", "absolute")
                              .style("z-index", "10")
                              .style("visibility", "hidden")
                              .text("a simple tooltip");


        // draw the genes

   var circle= svg.selectAll("circle")
                  .data(geneDataset)
                  .enter()
                  .append("circle")
                  .attr("cx", function(d,i) {return xScale(d[0]);})
                  .attr("cy", function(d,i) {return yScale(d[1]);})
                  .attr("r",  function(d)   {return 3;})
                  .text(function(d,i){
                     return(geneNames[i]);
                     })
                  .style("fill", function(d) { return assignColor(d.category); })
                  .on("mouseover", function(d,i){
                     tooltip.text(geneNames[i]);
                     return tooltip.style("visibility", "visible");
                     })
                  .on("mousemove", function(){
                      return tooltip.style("top", (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
                  .on("mouseout", function(){return tooltip.style("visibility", "hidden");});

   var line = svg.selectAll("line")
                 .data(vectors)
                 .enter().append("line")
                         .attr("class", "line")
                         .style("stroke-width", 1)
                         .style("stroke", "red")
                         .attr("x1", xScale(0))
                         .attr("y1", yScale(0))
                         .attr("x2", function(v) { return xScale(v[0]); })
                         .attr("y2", function(v) { return yScale(v[1]); });

   var text = svg.selectAll("text")
                 .data(vectors)
                 .enter().append("text")
                         .attr("class", "text")
                         .attr("x", function(v) { return xScale(v[0]); })
                         .attr("y", function(v) { return yScale(v[1]); })
                         .text( function(v, i) {return vectorNames[i];})
                         .attr("text-anchor", "middle")
                         .style("fill", "black") ;
     return(svg);

} // d3PlsrScatterPlot
//--------------------------------------------------------------------------------------------
function handleWindowResize ()
{
   plsrDisplay.width($(window).width() * 0.95);
   plsrDisplay.height($(window).height() * 0.75);

   if(!firstTime)  // easiest way to handle resize: redraw from scratch
      d3PlsrScatterPlot(geneLoadings, geneNames, vectors, vectorNames, currentAbsoluteMaxValue);

} // handleWindowResize
//--------------------------------------------------------------------------------------------
function identifyEntitiesInCurrentSelection ()
{
   x1 = currentlySelectedRegion[0][0];
   y1 = currentlySelectedRegion[0][1];
   x2 = currentlySelectedRegion[1][0];
   y2 = currentlySelectedRegion[1][1];
   ids = [];
   for(var i=0; i < geneLoadings.length; i++){
     x = geneLoadings[i][0];
     y = geneLoadings[i][1];
     geneSymbol = geneNames[i];
     if(x >= x1 & x <= x2 & y >= y1 & y <= y2)         
       ids.push(geneSymbol);
      } // for i

   return(ids);
    
} // identifyEntitiesInCurrentSelection
//--------------------------------------------------------------------------------------------
function selectPoints(ids, clearIDs)
{
   d3.selectAll("circle")
     .filter(function(d,i){
         match = ids.indexOf(geneNames[i]);
         if(match >= 0){
            console.log("PLSR select match: " + geneNames[i]);
            }
         return (match >= 0);
         }) // filter
     .classed("highlighted", true)
     .transition()
     .attr("r", 20)
     .style("fill", "red")
     .duration(500);

} // selectPoints
//----------------------------------------------------------------------------------------------------
function clearSelection()
{

  d3.selectAll("circle")
    .classed("highlighted", false)
    .attr("r", 3);

  d3brush.clear();
  svg.selectAll('.brush').call(d3brush);
  handleWindowResize();

} // clearSelection
//----------------------------------------------------------------------------------------------------

function highlightGenes(msg)
{
   hub.raiseTab(thisModulesOutermostDiv);

   var candidates = msg.payload.value;
   console.log("PLSR highlight genes, candidates: " + candidates.length);
   console.log("                  currently held: " + geneNames.length);

   var intersection = hub.intersectionOfArrays(candidates, geneNames);
   console.log("                    intersection: " + intersection.length);
   console.log(JSON.stringify(intersection));

   if(intersection.length === 0){
     count = candidates.length;
     errorMessage = "None of the incoming ids were recognized: ";
     for(var i=0; i < count; i++){
       errorMessage += candidates[i] + " ";
       }
     title = "Unrecognized Identifiers";
     $('<div />').html(errorMessage).dialog({title: title, width:600, height:300});
     } // if intersection
   else
     selectPoints(candidates, true);

} // highlightGenes
//----------------------------------------------------------------------------------------------------
function requestGeneSetNames()
{
   callback = "plsrHandleGeneSetNames";

   msg = {cmd:"getGeneSetNames",
          callback: callback,
          status:"request",
          payload:""};

   hub.send(JSON.stringify(msg));

} // requestGeneSetNames
//--------------------------------------------------------------------------------------------
function handleGeneSetNames(msg)
{
   newNames = msg.payload;
   addGeneSetNamesToMenu(newNames);
   hub.enableButton(calculateButton);
   hub.enableTab(thisModulesOutermostDiv);

} // handleGeneSetNames
//--------------------------------------------------------------------------------------------
function demoSetDataSet()
{
  msg = {cmd: "specifyCurrentDataset", callback: "specifyCurrentDatasetHandler", 
         status: "request", payload: "TCGAgbm"};

  hub.send(JSON.stringify(msg));

    // if the callback gets a success message, the patient data will be queried on the 
    // server to get mins and maxes for the slider

} // demoSetDataSet
//--------------------------------------------------------------------------------------------
//function specifyCurrentDataSetHandler(msg)
//{
//   msg = {cmd: "summarizePLSRPatientAttributes",
//          callback: "handleAgeAtDxAndSurvivalRanges",
//          status: "request", payload: ["AgeDx", "Survival"]};
//
// } // specifyCurrentDataSetHandler
//-------------------------------------------------------------------------------------------
// when a dataset is specified, this module 
//  1) extracts the name of the dataset from the payload of the incoming msg
//  2) (for now) extracts the name of the matrices, from the manifest (also in the payload
//     of the incoming msg, chooses the first mtx.mrna entry it finds
//  3) sends a "createPLSR" message to the server, with dataset & matrix name specified
//  4) asks that the server, upon successful completion of that createPLSR request, callback
//     here so that the sliders can be set
function datasetSpecified(msg)
{
   console.log("==== Module.plsr, datasetSpecified");
   console.log(msg);

   plsrXXX = msg;
   var dataPackageName = msg.payload.datasetName;
 
       // ["mtx.cn.RData", "history.RData", "mtx.mrna.RData", "mtx.mrna.ueArray.RData", 
       // "mtx.mut.RData", "mtx.prot.RData", "mtx.meth.RData", "markers.json.RData", 
       // "genesets.RData", "g.markers.json"]
   var dataElementNames = msg.payload.rownames;

      // for now, and very temporarily, use the first match (if any are found)
   var hits = dataElementNames.map(function(name) {if(name.indexOf("mtx.mrna") >= 0) return(name);});
   hits = hits.filter(function(n){ return (n !== undefined); });

   var matrixName = null;

   if(hits.length > 0){
        // for now always grab the last hit, remove the trailing .RData
        // the PLSR constructor wants both dataPacakgeName & a matrix name
        // our convention is that the maniftest rowname is the same as
        // its name, with ".RData" appended
      var lastHit = hits.length - 1;
      matrixName = hits[lastHit].replace(".RData", "");
      }
   else{
      hub.disableButton(calculateButton);
      return;
      }
   
   createPlsrObjectOnServer(dataPackageName, matrixName);
   d3plsrDisplay.select("#plsrSVG").remove();  // so that old layouts aren't mistaken for new dataset


} // datasetSpecified
//--------------------------------------------------------------------------------------------
function createPlsrObjectOnServer(dataPackageName, matrixName)
{
  console.log("create PLSR on server " + dataPackageName + ": " + matrixName);
  payload = {dataPackage: dataPackageName, matrixName: matrixName};

  msg = {cmd: "createPLSR", callback: "plsrObjectCreated", status: "request", payload: payload};

  msg.json = JSON.stringify(msg);
  hub.send(msg.json);

} // createPlsrObjectOnServer
//--------------------------------------------------------------------------------------------
function requestSliderRanges(msg)
{
   console.log("--- requestSliderRanges");
   console.log(msg);
   msg = {cmd: "summarizePLSRPatientAttributes",
          callback: "handleAgeAtDxAndSurvivalRanges",
          status: "request", payload: ["AgeDx", "Survival"]};

   hub.send(JSON.stringify(msg));

} // requestSliderRanges
//--------------------------------------------------------------------------------------------
// in normal use, the user will choose a dataset to analyze.
// in standalone testing and demo mode, we have to do this first.
//
function demo()
{
   hub.raiseTab(thisModulesOutermostDiv);
   hub.send(JSON.stringify({cmd: "specifyCurrentDataset",  callback: "datasetSpecified",
                            status: "request", payload: "DEMOdz"}));

} // demo
//--------------------------------------------------------------------------------------------
function runTests()
{
  // the test does not currently depend upon any other tabs, but we want to add some
  // real world complexity to the situation, so we use tabs, including plsr (of course)
  // and the usual introcutory "Datasets" tab.  make sure it is there
  // tests depend upon the presence of 2 tabs in addition to the present one.

  var datasetsTabPresent = $("#datasetsDiv").length > 0;

  if(!datasetsTabPresent){
     alert("Datasets tab needed for QUnit testing");
     return;
     } // check for other needed tabs

   testResultsOutputDiv.css({display: "block"});
   testLoadDataset();

} // runTests
//--------------------------------------------------------------------------------------------
function testLoadDataset()
{
   QUnit.test('choose DEMOdz dataset', function(assert) {
      hub.raiseTab("datasetsDiv");
      var desiredDataset = "DEMOdz";
      var dzNames = $("#datasetMenu option").map(function(opt){return this.value;});

      if($.inArray(desiredDataset, dzNames) < 0){
         alert("cannot run tests:  " + desiredDataset + " dataset not loaded");
         return;
         }

      $("#datasetMenu").val(desiredDataset);
      $("#datasetMenu").trigger("change");

      var done1 = assert.async();
      var done2 = assert.async();
      var done3 = assert.async();
      assert.expect(3);

      setTimeout(function(){
         assert.equal($("#datasetMenu").val(), desiredDataset);  done1();
         assert.ok($("#datasetsManifestTable tr").length >= 10); done2();
         assert.equal($("#datasetsManifestTable tbody tr").eq(0).find("td").eq(0).text(), 
                      "mRNA expression"); done3();
         $("#selectDatasetButton").click();
         hub.raiseTab(thisModulesOutermostDiv);
         testCalculate();
         }, 5000);
      });

} // testLoadDataset
//----------------------------------------------------------------------------------------------------
function testCalculate()
{
   hub.raiseTab(thisModulesOutermostDiv);
   console.log("starting testCalculate");

     // enable the calculate button
     // change its color
     // wait 6 seconds to be sure slider mins and maxes and geneset are all in place
     // then click the calculate button
   QUnit.test('testPlsrCalculate', function(assert) {
      $("#plsrCalculateButton").prop("disabled", false);
      $("#plsrCalculateButton").css({"background-color": "red", "color": "green"});
      assert.expect(0);   // tests (assertions) in next function, testContentsOfPlsrPlot
      setTimeout(function(){
         $("#plsrCalculateButton").click();
         testContentsOfPlsrPlot();
         }, 6000);
      });

} // testCalculate
//----------------------------------------------------------------------------------------------------
function testContentsOfPlsrPlot()
{
   console.log("--- testContentsOfPlsrPlot");

      // wait 5 seconds
      // make sure there are the right number of circles
      // check the coordinates of two, selected arbitrarily
   QUnit.test('testPlsrContents', function(assert) {
      assert.expect(5);
      var done1 = assert.async();
      var done2 = assert.async();
      var done3 = assert.async();
      var done4 = assert.async();
      var done5 = assert.async();
      setTimeout(function(){
         assert.equal($("circle").length, 40); done1();
         var c0 = $("circle")[0];
         var xPos = Number(c0.getAttribute("cx"));
         var yPos =  Number(c0.getAttribute("cy"));
         var radius = Number(c0.getAttribute("r"));
         console.log(xPos + "  " + yPos + "  " + radius);
         assert.equal(c0.innerHTML, "PRRX1"); done2();
         assert.ok(xPos > 0); done3();
         assert.ok(yPos > 0); done4();
         assert.equal(radius, 3); done5();
         }, 5000);
      });


} // testContentsOfPlsrPlot
//----------------------------------------------------------------------------------------------------
// query the oncoscape server for user id.  the callback then makes a local (that is,
// Module-specific) decision to run this module's automated tests based upon that id
//
function runAutomatedTestsIfAppropriate()
{
   var msg = {cmd: "getUserId",  callback: "plsrAssessUserIdForTesting",
              status: "request", payload: ""};

   hub.send(JSON.stringify(msg));

} // runAutomatedTestsIfAppropriate
//----------------------------------------------------------------------------------------------------
function assessUserIdForTesting(msg)
{
   var userID = msg.payload;

   if(userID.indexOf("autoTest") === 0){
      console.log("plsr/Module.js running tests for user " + userID);
      for(var i=0; i < 3; i++)
          runTests();
      } // if autoTest

} // assessUserIdForTesting
//----------------------------------------------------------------------------------------------------
function initializeModule()
{
   hub.addOnDocumentReadyFunction(initializeUI);
   hub.registerSelectionDestination(selectionDestinationsOfferedHere, thisModulesOutermostDiv);
   hub.addMessageHandler("plsrHandleGeneSetNames", handleGeneSetNames);
   hub.addMessageHandler("handlePlsrResults", handlePlsrResults);
   hub.addMessageHandler("handleAgeAtDxAndSurvivalRanges", handleAgeAtDxAndSurvivalRanges);
   hub.addMessageHandler("datasetSpecified", datasetSpecified);
   hub.addMessageHandler("sendSelectionTo_PLSR (highlight)", highlightGenes);
   hub.addMessageHandler("plsrObjectCreated", requestSliderRanges);
   hub.addMessageHandler("plsrAssessUserIdForTesting", assessUserIdForTesting);
   hub.addSocketConnectedFunction(runAutomatedTestsIfAppropriate);

} // initializeModule
//--------------------------------------------------------------------------------------------
return{
   init: initializeModule,
   demo: demo
   };

}); // PLSRModule
//----------------------------------------------------------------------------------------------------
plsr = PLSRModule();
plsr.init();
