// -- global variables --

// object that stores the current pattern in local storage
var pattern = {
  chartType: "G",
  gridColumns: 31,
  gridRows: 31,
  cellsColorB: [],
  cellsNoStitch: [],
  font: []
};

// colors
var colorA = "white";
var colorB = "gray";
var colorNoStitch = "gainsboro";

// maximums
var maxGridColumns = 999;
var maxGridRows = 999;

// object that stores info about the current selection (for cut, paste, etc.)
var selection = {
  fromId: "",
  toId: "",
  cells: [],
  action: ""
};

// symbols used in the pattern
var plain = "";
var overlay = "X";
var increase = "+";
var decrease = "-";

var tabs = ["SetupChart", "EditChart", "ImportImage", "ImportText", "ImportFont"]

// -- global functions 

function showHelp(btn) {
  let idDiv = "div" + btn.id.substring(3);
  let divHelp = document.getElementById(idDiv);
  if (divHelp.style.display == "none") {
    divHelp.style.display = "";
  }
  else {
    divHelp.style.display = "none";
  }
}

// gets the row and column
// from the id of the td in the table
// returns:
// row - row of the cell with the specified id
// column - column of the cell with the specified id
function splitId(id) {
  let ids = id.split("_");
  let r = parseInt(ids[1], 10);
  let c = parseInt(ids[2], 10);
  return {
    row: r,
    column: c
  }
}

// gets the specified cell from the chart grid
// row - row of the cell to get
// column - column of the cell to get
// returns the td in the table that represents the cell in the grid
function getCell(row, column) {
  let td = document.getElementById("_" + row + "_" + column);
  return td;
}

// gets the min/max rows and columns of cell ids based on the specified from and to
// fromId - the id of the from td in the table
// toId - the id of the to td in the table
// returns:
// minR - minimum row of the range
// maxR - maximum row of the range
// minC - minimum column of the range
// maxC - maximum column of the range
function getIdRange(fromId, toId) {
  let fromIds = splitId(fromId);
  let toIds = splitId(toId);

  let maxR = toIds.row;
  let minR = fromIds.row;
  if (parseInt(maxR, 10) < parseInt(minR, 10)) {
    maxR = fromIds.row;
    minR = toIds.row;
  }
  if (!isShaping()) {
    if (maxR % 2 !== 0) {
      maxR = maxR - 1;
    }
    if (minR % 2 !== 0) {
      minR = minR - 1;
    }
    if (minR < 1) {
      minR = 1;
    }
  }
  let maxC = toIds.column;
  let minC = fromIds.column;
  if (parseInt(maxC, 10) < parseInt(minC, 10)) {
    maxC = fromIds.column;
    minC = toIds.column;
  }
  if (minC < 1) {
    minC = 1;
  }

  return {
    minR: minR,
    maxR: maxR,
    minC: minC,
    maxC: maxC
  }
}

function switchTab(id){
  for (t = 0; t < tabs.length; t++) {
    let div = document.getElementById("div" + tabs[t]);
    div.style.display = "none";
    if (tabs[t] == id) {
      div.style.display = "";
    }
    let anchor = document.getElementById("tab" + tabs[t]);
    anchor.className = "tabTitle";
    if (tabs[t]== id) {
      anchor.classList.add("tabSelected");
    }
  }

}

// -- setup chart --

// changes the type of chart displayed
// chartType - the type of chart to display
function changeChartType(chartType) {
  pattern.chartType = chartType;
  savePattern();
  loadChart();
  refreshPreview();
  writeInstructions();
}

// changes the number of grid columns displayed in the chart
// gridColumns - number of grid columns to display
function changeGridColumns(gridColumns) {
  gridColumns = parseInt(gridColumns, 10);
  if (gridColumns > 0 && gridColumns <= maxGridColumns) {
    for (r = 1; r <= pattern.gridRows; r++) {
      let td = getCell(r, pattern.gridColumns);
      td.style.backgroundColor = colorA;
    }
    pattern.gridColumns = gridColumns;
  }
  let txtGridColumns = document.getElementById("txtGridColumns");
  txtGridColumns.value = gridColumns;

  savePattern();
  loadChart();
  refreshPreview();
  writeInstructions();
}

// changes the number of grid rows displayed in the chart
// gridRows - number of grid rows to display
function changeGridRows(gridRows) {
  gridRows = parseInt(gridRows, 10);
  if (gridRows > 0 && gridRows <= maxGridRows) {
    pattern.gridRows = gridRows;
  }
  let txtGridRows = document.getElementById("txtGridRows");
  txtGridRows.value = gridRows;
  savePattern();
  loadChart();
  refreshPreview();
  writeInstructions();
}

// when the current editing mode for the chart is changed
// clears the current selection (if any) 
function changeMode() {
  clearSelection();
  selection.fromId = "";
  selection.toId = "";
  selection.cells = [];
  selection.action = "";
  let divSelectionMenu = document.getElementById("divSelectionMenu");
  divSelectionMenu.style.display = "none";
}

// -- import image --

// where the image should be imported to
// returns the destination currently selected in the dropdown
// empty string - overwrite the existing chart
// C - import to clipboard
function importImageTo() {
  return document.getElementById("selImportImageTo").value;
}

// when the import button in the import image section is clicked
// imports the currently selected image
// to fit in the specified number of rows or columns
// clearing and resizing the chart based on the image
function importImage() {
  if (importImageTo() !== "" || clearChart()) {
    let fitType = document.getElementById("selFitType").value;
    let fitNumber = document.getElementById("txtFitNumber").value;
    let cnvPlain = document.getElementById("cnvPlain");
    let ctx = cnvPlain.getContext("2d");
    let imgImport = document.getElementById("imgImport");
    let wscale = fitNumber / imgImport.width;
    let hscale = wscale;
    if (pattern.chartType == "S") {
      hscale = 0.75 * wscale;
    }
    if (fitType == "R") {
      hscale = fitNumber / imgImport.height;
      wscale = hscale;
      if (pattern.chartType == "S") {
        wscale = 1.33 * hscale;
      }
    }

    cnvPlain.height = (imgImport.height * hscale);
    cnvPlain.width = (imgImport.width * wscale);
    if (cnvPlain.height % 2 == 0) {
      cnvPlain.height = cnvPlain.height + 1;
    }
    ctx.scale(wscale, hscale);
    ctx.drawImage(imgImport, 0, 0);

    let imageData = ctx.getImageData(0, 0, cnvPlain.width, cnvPlain.height);
    let imgColumns = cnvPlain.width;
    let imgRows = cnvPlain.height;

    if (importImageTo() == "") {
      pattern.gridColumns = imgColumns;
      pattern.gridRows = imgRows;
      loadChart();
    }

    let arrCells = new Array();
    
    for (r = imgRows - 1; r > -1; r--) {
      for (c = imgColumns - 1; c > -1; c--) {

        let redComp = imageData.data[((r * (cnvPlain.width * 4)) + (c * 4))];
        let greenComp = imageData.data[((r * (cnvPlain.width * 4)) + (c * 4)) + 1];
        let blueComp = imageData.data[((r * (cnvPlain.width * 4)) + (c * 4)) + 2];
        let trans = imageData.data[((r * (cnvPlain.width * 4)) + (c * 4)) + 3];
        let avg = (redComp + greenComp + blueComp) / 3

        if (trans > 0 && avg < 200) {
          let currR = imgRows - r;
          let currC = imgColumns - c;
          if (importImageTo() == "") {
            placePoint(currR, currC, colorB);
          }
          else {
            let cell = {
              row: currR,
              column: currC,
              color: colorB
            }
            arrCells.push(cell);
            if (currR % 2 !== 0) {
              cell = {
                row: currR - 1,
                column: currC,
                color: colorB
              }
              arrCells.push(cell);
              cell = {
                row: currR + 1,
                column: currC,
                color: colorB
              }
              arrCells.push(cell);
            }
          }
        }
      }
    }
    if (importImageTo() == "") {
      addXs();
      savePattern();
      restorePattern();
      loadChart();
      refreshPreview();
      writeInstructions();
    }
    else {
      refreshPreview();
      document.getElementById("selMode").value = "S";
      arrCells.sort((a,b) => b.column - a.column);
      arrCells.sort((a,b) => b.row - a.row);

      selection.cells = arrCells;
      alert("Imported to clipboard.  Select an area in the chart and choose a paste option.");
    }
  }
}

// -- edit chart --

// when the clear button is clicked
// (or one of the import buttons)
// clears the chart
function clearChart() {
  let ret = false;
  if (confirm("Previous design will be cleared.  Okay to continue?")) {
    for (r = pattern.gridRows; r > 0; r--) {
      for (c = pattern.gridColumns; c > 0; c--) {
        let td = getCell(r, c);
        td.style.backgroundColor = colorA;
      }
    }
    savePattern();
    loadChart();
    refreshPreview();
    writeInstructions();
    ret = true;
  }
  return ret;
}

// when the undo button is clicked
// undoes the last action
function undo() {
  if (localStorage.getItem("patternUndo") !== null) {
    let patternUndo = JSON.parse(localStorage.getItem("patternUndo"));
    localStorage.setItem("patternUndo", JSON.stringify(pattern));
    localStorage.setItem("pattern", JSON.stringify(patternUndo));
    restorePattern();
    loadChart();
    refreshPreview();
    writeInstructions();
  }
}

// when the chart mode is select and a cell is clicked
// if no cells are currently displayed as selected, the clicked cell begins a new selection
// otherwise, the cells displayed as selected end with the clicked cell 
// and the selection menu is displayed
// if there is a selection stored in the "clipboard", paste options are included
function selectCell(td) {
  if (selection.fromId == "") {
    let idRange = getIdRange(td.id, td.id);
    td = getCell(idRange.minR, idRange.minC);
    selection.fromId = td.id;
    td.style.borderColor = "red";
  }
  else {
    selection.toId = td.id;
    let idRange = getIdRange(selection.fromId, selection.toId);

    for (r = pattern.gridRows; r > 1; r--) {
      for (c = pattern.gridColumns - 1; c > 1; c--) {
        let gridTd = getCell(r, c);
        gridTd.style.borderColor = "";
        if (r >= idRange.minR && r <= idRange.maxR && c >= idRange.minC && c <= idRange.maxC) {
          gridTd.style.borderColor = "red";
        }
      }
    }

    let rect = td.getBoundingClientRect(); 
    let divSelectionMenu = document.getElementById("divSelectionMenu");
    divSelectionMenu.style.display = "";
    divSelectionMenu.style.left = Math.round(rect.left + window.scrollX) + "px";
    divSelectionMenu.style.top = Math.round(rect.top + window.scrollY) + "px";
    let divPaste = document.getElementById("divPaste");
    if (selection.cells.length > 0) {
      divPaste.style.display = "";
    }
    else {
      divPaste.style.display = "none";
    }
  }
}

// fills the specified cell and the cells on either side of the specified cell
// that are the specified current color with the specified fill color
// cellId - identifies the cell within the row to fill out from
// fillColor - color to fill the cells with
// currColor - current color to fill with the new color
// returns:
// minC - minimum column in the row that was filled with the new color
// maxC - maximum column in the row that was filled with the new color
// when filling colorB with colorA, the edges of the area are left in colorB
function fillRow(cellId, fillColor, currColor) {
  let minC = parseInt(cellId.column, 10);
  while (minC > 2) {
    let checkCell = getCell(cellId.row, minC - 1);
    if (fillColor == colorA && !isShaping()) {
      checkCell = getCell(cellId.row, minC - 2);
    }
    if (checkCell.style.backgroundColor !== currColor) {
      break;
    }
    minC = minC - 1;
  }
  let maxC = parseInt(cellId.column, 10);
  while (maxC < pattern.gridColumns - 2) {
    let checkCell = getCell(cellId.row, maxC + 1);
    if (fillColor == colorA && !isShaping()) {
      checkCell = getCell(cellId.row, maxC + 2);
    }
    if (checkCell.style.backgroundColor !== currColor) {
      break;
    }
    maxC = maxC + 1;
  }
  for (c = minC; c <= maxC; c++) {
    let fillCell = getCell(cellId.row, c);
    fillCell.style.backgroundColor = fillColor;
  }
  return {
    minC: minC,
    maxC: maxC
  }
}

// fills the space starting at the specified cell
// the fill color is the opposite of the current color of the specified cell
// if the shaping checkbox is checked the fill color toggles between "no stitch" and colorA
// otherwise, the fill color toggles between colorB and colorA
// if the shaping checkbox is checked and the current cell is colorB, the fill color is "no stitch"
// otherwise, if the current cell is "no stitch", the fill color is colorA
// when filling colorB with colorA, the edges of the area are left in colorB
// td - the specified cell to fill out from
// this is a lazy flood fill and may not fill the entire area
function fill(td) {
  let cellId = splitId(td.id);
  let currColor = td.style.backgroundColor;
  let fillColor = colorB;
  if (isShaping()) {
    fillColor = colorNoStitch;
  }
  if (fillColor == currColor) {
    fillColor = colorA;
  }
  if (currColor !== colorNoStitch || isShaping()) {
    let minR = parseInt(cellId.row, 10);
    while (minR > 2) {
      let checkCell = getCell(minR - 1, cellId.column);
      if (fillColor == colorA && !isShaping()) {
        checkCell = getCell(minR - 2, cellId.column);
      }
      if (checkCell == null || checkCell.style.backgroundColor !== currColor) {
        break;
      }
      minR = minR - 1;
    }
    let maxR = parseInt(cellId.row, 10);
    while (maxR <= pattern.gridRows - 2) {
      let checkCell = getCell(maxR + 1, cellId.column);
      if (fillColor == colorA && !isShaping()) {
        checkCell = getCell(maxR + 2, cellId.column);
      }
      if (checkCell == null || checkCell.style.backgroundColor !== currColor) {
        break;
      }
      maxR = maxR + 1;
    }
    let prevMinMaxC = {
    }
    for (r = minR; r <= maxR; r++) {
      cellId.row = r;
      let minMaxC = fillRow(cellId, fillColor, currColor);
      if (r > minR && fillColor == colorA && !isShaping()) {
        if (prevMinMaxC.minC < minMaxC.minC) {
          drawLine(r - 1, minMaxC.minC - 1, r - 1, prevMinMaxC.minC - 1);
        }
        if (prevMinMaxC.minC > minMaxC.minC) {
          drawLine(r, minMaxC.minC - 1, r, prevMinMaxC.minC - 1);
        }
        if (prevMinMaxC.maxC > minMaxC.maxC) {
          drawLine(r - 1, minMaxC.maxC + 1, r - 1, prevMinMaxC.maxC + 1);
        }
        if (prevMinMaxC.maxC < minMaxC.maxC) {
          drawLine(r, minMaxC.maxC + 1, r, prevMinMaxC.maxC + 1);
        }
      }
      prevMinMaxC = minMaxC;
    }
    addXs();
    savePattern();
    refreshPreview();
    writeInstructions();
  }
}

// whether or not shaping is being edited
// returns true if the shaping checkbox is checked
// otherwise returns false
function isShaping() {
  return document.getElementById("chkShaping").checked;
}

// current mode of chart editing in effect
// returns the mode currently selected in the dropdown
function chartMode() {
  return document.getElementById("selMode").value;
}

// when a cell is clicked
// if in toggle mode, the color of the cell is toggled
// if in select mode, if no cells are selected, begins a new selection, otherwise sets the end of the selection
// if in fill mode, fills out from the clicked cell, 
// toggling the color of the clicked cell and the surrounding cells that are the same color as the clicked cell
function clickCell(td) {
  switch (chartMode()) {
    case "T":
      toggleCell(td);
      break;
    case "S":
      selectCell(td);
      break;
    case "F":
      fill(td);
      break;
  }
}

// when the chart mode is toggle and a cell is clicked
// toggles the color of the cell
// if the shaping checkbox is checked toggles between "no stitch" and colorA
// otherwise toggles between colorB and colorA
// if the shaping checkbox is checked, only the cell clicked is affected
// otherwise if toggling to colorA on a colorB row or vice versa
// the cell above and below the clicked cell are changed to match the clicked cell
// because to get that color on that row and overlay stitch is required
function toggleCell(td) {
  let id = splitId(td.id);
  if (td.style.backgroundColor !== colorNoStitch && !isShaping()) {
    if (id.row >= 1 && id.row <= pattern.gridRows && id.column >= 1 && id.column <= pattern.gridColumns) {
      if (td.style.backgroundColor == colorB) {
        placePoint(id.row, id.column, colorA);
      }
      else {
        placePoint(id.row, id.column, colorB);
      }
    }
  }
  if (isShaping()) {
    if (td.style.backgroundColor == colorNoStitch) {
      td.style.backgroundColor = colorA;
    }
    else {
      td.style.backgroundColor = colorNoStitch;
    }
  }
  addXs();
  savePattern();
  refreshPreview();
  writeInstructions();
}

// when the chart is changed
// adds Xs to the chart to identify the overlay stitches
// also makes sure that the edge stitches on each row
// (first and last actual stitches, not "no stitch")
// are the same color as the color worked on that row
function addXs() {
  for (r = pattern.gridRows; r > 1; r--) {
    let edgeColumns = getEdgeColumns(r);
    for (c = pattern.gridColumns; c >= 1; c--) {
      let td = getCell(r, c);
      td.innerHTML = plain;
      if (c == edgeColumns.first || c == edgeColumns.last || r == 1 || r == pattern.gridRows) {
        if (r % 2 == 0) {
          td.style.backgroundColor = colorB;
        }
        else {
          td.style.backgroundColor = colorA;
        }
      }
      let rBelow = parseInt(r, 10) - 1;
      let tdBelow = getCell(rBelow, c);
      let color = td.style.backgroundColor;
      let colorBelow = tdBelow.style.backgroundColor;
      if (c > edgeColumns.first && c < edgeColumns.last) {
        if (r % 2 == 0) {
          if (color == colorB && colorBelow == colorB) {
            td.innerHTML = overlay;
          }
        }
        else {
          if (color == colorA && colorBelow == colorA) {
            td.innerHTML = overlay;
          }
        }
      }
    }
  }
}

// finds the first and last actual stitches (not "no stitch")
// in the specified row
// row - number of the row
// returns:
// first - first column in the specified row containing an actual stitch
// last - last column in the specified row containing an actual stitch
// used by addXs, the first and last stitches of an actual row 
// must be the color used on that row
function getEdgeColumns(row) {
  let edgeColumns = {
    first: 1,
    last: pattern.gridColumns
  }
  for (c = 1; c <= pattern.gridColumns; c++) {
    let td = getCell(row, c);
    if (td !== null && td.style.backgroundColor !== colorNoStitch) {
      edgeColumns.first = c;
      break;
    }
  }
  for (c = pattern.gridColumns; c >= 1; c--) {
    let td = getCell(row, c);
    if (td !== null && td.style.backgroundColor !== colorNoStitch) {
      edgeColumns.last = c;
      break;
    }
  }
  return edgeColumns;
}


// resets the border color for any selected cells
function hideSelection() {
  let idRange = getIdRange(selection.fromId, selection.toId);
  for (r = 1; r <= pattern.gridRows; r++) {
    for (c = 1; c <= pattern.gridColumns; c++) {
      let td = getCell(r, c);
      td.style.borderColor = "";
    }
  }
}

// clears the current selection from memory
function clearSelection() {
  hideSelection();
  selection.fromId = "";
  selection.toId = "";
  selection.cells = [];
}

// changes the color of the cell at the specified row/column to the specified color
// row - row of the cell
// column - column of the cell
// setColor - color to change the cell to
// "no stitch" cells cannot be changed unless the shaping checkbox is checked
// if changing a cell to colorA on a colorB row or colorB on a colorA row
// also changes the cells in the same column on the row above and row below to the setColor
// since the only way to get that color on that row is an overlay stitch
function placePoint(row, column, setColor) {
  let td = getCell(row, column);
  if (td !== null) {
    if (setColor !== colorNoStitch) {
      if ((setColor == colorA && row % 2 == 0) || (setColor == colorB && row % 2 !== 0)) {
        let tdAbove = getCell(row + 1, column);
        let tdBelow = getCell(row - 1, column);
        if (tdAbove !== null && tdBelow !== null && tdAbove.style.backgroundColor !== colorNoStitch) {
          tdAbove.style.backgroundColor = setColor;
          td.style.backgroundColor = setColor;
          if (tdBelow.style.backgroundColor !== colorNoStitch) {
            tdBelow.style.backgroundColor = setColor;
          }
        }
      }
      else {
        td.style.backgroundColor = setColor;
      }
    }
    else {
      if (isShaping()) {
        td.style.backgroundColor = setColor;
      }
    }
  }
}

// draws a line from the specified from row/column to the specified to row/column
// fromR - row number of the from row/column
// fromC - column number of the from row/column
// toR - row number of the to row/column
// toC - column number of the to row/column
// if the shaping checkbox is checked, the line is drawn in the "no stitch" color
// otherwise the line is drawn in colorB
function drawLine(fromR, fromC, toR, toC) {
  let slope = 0;
  let lineColor = colorB;
  if (isShaping()) {
    lineColor = colorNoStitch;
  }
  if (fromC !== toC) {
    slope = (toR - fromR) / (toC - fromC);
  }
  let yIntercept = fromR - (slope * fromC);
  let minC = fromC;
  let maxC = toC;
  if (fromC > toC) {
    minC = toC;
    maxC = fromC;
  }
  let minR = fromR;
  let maxR = toR;
  if (fromR > toR) {
    minR = toR;
    maxR = fromR;
  }
  if (slope == 0) {
    if (minR < maxR) {
      for (r = minR; r <= maxR; r++) {
        placePoint(r, fromC, lineColor);
      }
    }
    else {
      for (c = minC; c <= maxC; c++) {
        placePoint(fromR, c, lineColor);
      }
    }
  }
  else {
    for (c = minC; c <= maxC; c++) {
      let r = Math.round((slope * c) + yIntercept);
      placePoint(r, c, lineColor);
    }
    for (r = minR; r <= maxR; r++) {
      let c = Math.round((r - yIntercept) / slope);
      placePoint(r, c, lineColor);
    }
  }
}

// draws a circle centered in the rectangle defined by the from row/colum and to row/column
// fromR - row number of the from row/column
// fromC - column number of the from row/column
// toR - row number of the to row/column
// toC - column number of the to row/column
function drawCircle(fromR, fromC, toR, toC) {
  let width = toC - fromC;
  let height = toR - fromR;
  let centerR = Math.round(height / 2) + fromR;
  let centerC = Math.round(width / 2) + fromC;
  if (pattern.chartType == "S") {
    height = height * 1.33;
  }
  let radius = Math.round(width / 2);
  if (width > height) {
    radius = Math.round(height / 2);
  }
  for (c = 0; c <= radius; c++) {
    let r = Math.sqrt((radius * radius) - (c * c));
    if (pattern.chartType == "S") {
      r = 0.75 * r;
    }
    r = Math.round(r);
    placePoint(centerR + r, centerC + c, colorB);
    placePoint(centerR - r, centerC - c, colorB);
    placePoint(centerR - r, centerC + c, colorB);
    placePoint(centerR + r, centerC - c, colorB);
  }
  let radiusInR = radius;
  if (pattern.chartType == "S") {
    radiusInR = Math.round(radius * 0.75);
  }
  for (r = 0; r <= radiusInR; r++) {
    let currR = r;
    if (pattern.chartType == "S") {
      currR = r * 1.33;
    }
    let c = Math.sqrt((radius * radius) - (currR * currR));
    c = Math.round(c);
    placePoint(centerR + r, centerC + c, colorB);
    placePoint(centerR - r, centerC - c, colorB);
    placePoint(centerR - r, centerC + c, colorB);
    placePoint(centerR + r, centerC - c, colorB);
  }
}

// when a shape is selected from the shape dropdown
// draws the selected shape inside the currently selected cells
function selectShape(selShape) {
  let idRange = getIdRange(selection.fromId, selection.toId);
  switch (selShape.value) {
    case "|":
      // vertical line
      drawLine(idRange.minR, idRange.maxC, idRange.maxR, idRange.maxC);
      break;
    case "_":
      // horizontal line
      drawLine(idRange.minR, idRange.minC, idRange.minR, idRange.maxC);
      break;
    case "/":
      // diagonal line slanting right
      drawLine(idRange.maxR, idRange.minC, idRange.minR, idRange.maxC);
      break;
    case "\\":
      // diagonal line slanting left
      drawLine(idRange.minR, idRange.minC, idRange.maxR, idRange.maxC);
      break;
    case "R":
      // rectangle
      drawLine(idRange.minR, idRange.maxC, idRange.maxR, idRange.maxC);
      drawLine(idRange.maxR, idRange.minC, idRange.maxR, idRange.maxC);
      drawLine(idRange.minR, idRange.minC, idRange.maxR, idRange.minC);
      drawLine(idRange.minR, idRange.minC, idRange.minR, idRange.maxC);
      break;
    case "C":
      // circle
      drawCircle(idRange.minR, idRange.minC, idRange.maxR, idRange.maxC)
      break;
  }
  clearSelection();
  selShape.value = "";
  let divSelectionMenu = document.getElementById("divSelectionMenu");
  divSelectionMenu.style.display = "none";
  addXs();
  refreshPreview();
  writeInstructions();
  savePattern();
}

// when a cut/copy option is selected from the dropdown
// the currently selected cells are saved to the global selection object
// if cut is selected, the currently selected cells are reset to colorA
function selectCutCopy(selCutCopy) {
  let idRange = getIdRange(selection.fromId, selection.toId);

  let arrCells = new Array();
  for (r = pattern.gridRows; r > 1; r--) {
    for (c = pattern.gridColumns - 1; c > 1; c--) {
      let gridTd = getCell(r, c);
      gridTd.style.borderColor = "";
      if (r >= idRange.minR && r <= idRange.maxR && c >= idRange.minC && c <= idRange.maxC) {
        let cell = {
          row: r,
          column: c,
          color: gridTd.style.backgroundColor
        }
        arrCells.push(cell);
        if (selCutCopy.value == "cut") {
          gridTd.style.backgroundColor = colorA;
        }
      }
    }
  }
  selection.cells = arrCells;
  selection.fromId = "";
  selection.toId = "";
  selCutCopy.value = "";
  let divSelectionMenu = document.getElementById("divSelectionMenu");
  divSelectionMenu.style.display = "none";
  addXs();
  refreshPreview();
  writeInstructions();
  savePattern();
}

function selectFont() {
  let idRange = getIdRange(selection.fromId, selection.toId);
  let fontLetter = prompt("font letter:");
  if (fontLetter != null) {
    let fontEntry = pattern.font.find((fe) => fe.letter.charCodeAt(0) == fontLetter.charCodeAt(0));
    if (fontEntry == undefined) {
      fontEntry = {
        letter: fontLetter,
        instructions: ""
      }
      pattern.font.push(fontEntry);
    }
    let fontInstruct = idRange.maxC - idRange.minC + 1;
    for (r = idRange.minR; r <= idRange.maxR + 1; r++) {
      let arrSts = new Array();
      for (c = idRange.minC; c <= idRange.maxC; c++) {
        let gridTd = getCell(r, c);
        gridTd.style.borderColor = "";
        let txt = plain;
        if (gridTd.innerHTML == overlay) {
          txt = overlay;
        }
        let st = {
          "num": 1,
          "txt": txt
        };
        arrSts.push(st);
      }
      if (arrSts.length > 0) {
        fontInstruct = fontInstruct + "; " + convertRow(arrSts);      
      }
    }
    fontEntry.instructions = fontInstruct;
    writeFontInstructions();
    selection.cells = [];
    selection.fromId = "";
    selection.toId = "";  
    let divSelectionMenu = document.getElementById("divSelectionMenu");
    divSelectionMenu.style.display = "none";
    addXs();
    refreshPreview();
    writeInstructions();
    savePattern();  
  }
}

function writeFontInstructions() {
  let fontInstruct = "";
  for (f = 0; f < pattern.font.length; f++) {
    fontInstruct = fontInstruct + pattern.font[f].letter + ": " + pattern.font[f].instructions + "\n";
  }
  let txtFont = document.getElementById("txtFont");
  txtFont.value = fontInstruct;
}

// when the cancel button is clicked in the selection menu
// the current selection is cancelled.
function cancelSelection() {
  selection.fromId = "";
  selection.toId = "";
  hideSelection();
  let divSelectionMenu = document.getElementById("divSelectionMenu");
  divSelectionMenu.style.display = "none";
}

// when a paste option is selected from the dropdown
// the cells saved in the global selection objected
// are pasted into the currently selected cells
// based on the paste option selected:
// leftTop - the left/top of the pasted cells match the left/top of the currently selected cells
// botRight - the bottom/right of the pasted cells match the bottom/right of the currently selected cells
// center - the center of the pasted cells match the center of the currently selected cells
// fill - the left/top of the pasted cells match the left/top of the currently selected cells 
// and the pasted cells repeat to fill the currently selected cells
// flipH - the left/top of the pasted cells match the left/top of the currently selected cells 
// and the pasted cells are flipped horizontally
// flipV - the left/top of the pasted cells match the left/top of the currently selected cells 
// and the pasted cells are flipped vertically
function selectPaste(selPaste) {
  let idRange = getIdRange(selection.fromId, selection.toId);
  selection.cells.sort((a,b) => a.row - b.row);
  let minCellRow = selection.cells[0].row;
  let maxCellRow = selection.cells[selection.cells.length - 1].row;
  selection.cells.sort((a,b) => a.column - b.column);
  let minCellColumn = selection.cells[0].column;
  let maxCellColumn = selection.cells[selection.cells.length - 1].column;
  let rowOffset = idRange.maxR - maxCellRow;
  let colOffset = idRange.maxC - maxCellColumn;
  let fromWidth = maxCellColumn - minCellColumn;
  let fromHeight = maxCellRow - minCellRow;
  let toWidth = idRange.maxC - idRange.minC + 1;
  let toHeight = idRange.maxR - idRange.minR + 1;
  if (selPaste.value == "center") {
    rowOffset = rowOffset - Math.round(toHeight / 2);
    rowOffset = rowOffset + Math.round(fromHeight / 2)
    colOffset = colOffset - Math.round(toWidth / 2);
    colOffset = colOffset + Math.round(fromWidth / 2);
  }
  if (selPaste.value == "botRight") {
    rowOffset = idRange.minR - minCellRow;
    colOffset = idRange.minC - minCellColumn;
  }
  if (rowOffset % 2 !== 0) {
    rowOffset = rowOffset + 1;
  }
  let vertRpts = 1;
  let horizRpts = 1;
  if (selPaste.value == "fill") {
    horizRpts = Math.round(toWidth / fromWidth) + 1;
    vertRpts = Math.round(toHeight / fromHeight) + 1;
  }
  let rowOffsetOrig = rowOffset;
  let colOffsetOrig = colOffset;
  for (v = 1; v <= vertRpts; v++) {
    rowOffset = rowOffsetOrig - ((v - 1) * fromHeight);
    for (h = 1; h <= horizRpts; h++) {
      colOffset = colOffsetOrig - ((h - 1) * (fromWidth + 1));
      for (i = 0; i < selection.cells.length; i++) {
        let r = selection.cells[i].row + rowOffset;
        if (selPaste.value == "flipV") {
          r = idRange.maxR - r + idRange.minR - fromHeight;
        }
        let c = selection.cells[i].column + colOffset;
        if (selPaste.value == "flipH") {
          c = idRange.maxC - c + idRange.minC - fromWidth;
        }
        let color = selection.cells[i].color;
        if (r > 1 && r < pattern.gridRows && c > 1 && c < pattern.gridColumns) {
          let td = getCell(r, c);
          if (selPaste.value == "fill") {
            if (r >= idRange.minR && r <= idRange.maxR && c >= idRange.minC && c <= idRange.maxC) {
              td.style.backgroundColor = color;
            }
          }
          else {
            td.style.backgroundColor = color;
          }
        }
      }
    }
  }

  hideSelection();
  selection.fromId = "";
  selection.toId = "";
  selPaste.value = "";
  let divSelectionMenu = document.getElementById("divSelectionMenu");
  divSelectionMenu.style.display = "none";
  addXs();
  refreshPreview();
  writeInstructions();
  savePattern();
}

// -- preview --

// whether or not the reverse checkbox is checked above the preview
// returns true if the checkbox is checked
// otherwise returns false.
function isReversePreview() {
  return document.getElementById("chkReversePreview").checked;
}

// whether or not the tile checkbox is checked above the preview
// returns true if the checkbox is checked
// otherwise returns false.
function isTile() {
  return document.getElementById("chkTile").checked;
}

// when the tile checkbox is checked or unchecked
// refreshes the preview
function changeTile() {
  refreshPreview();
}

// displays a 9x9 grid tiled 
// based on the preview shape
function tilePreview() {
  let cnvPlain = document.getElementById("cnvPlain");
  let cnv = document.getElementById("cnvRepeat");
  if (isTile()) {
    cnvPlain.style.display = "none";
    cnv.style.display = "";
    let img = document.getElementById("cnvPlain");
    cnv.width  = img.width * 3;
    cnv.height = img.height * 3;
    let ctx = cnv.getContext("2d");
    ctx.clearRect(0, 0, cnv.width, cnv.height);
    if (previewShape() !== "H") {
      let pat = ctx.createPattern(img, "repeat");
      ctx.rect(0, 0, cnv.width, cnv.height);
      ctx.fillStyle = pat;
      ctx.fill();
    }
    else {
      let imgW = img.width/2;
      let imgH = img.height/2;
      cnv.width  = imgW * 2.5;
      cnv.height = imgH * 3.5;
      ctx.drawImage(img, 0, 0, imgW, imgH);
      ctx.drawImage(img, 0, imgH, imgW, imgH);
      ctx.drawImage(img, 0, imgH * 2, imgW, imgH);
      ctx.drawImage(img, imgW * 0.75, imgH * 0.5, imgW, imgH);
      ctx.drawImage(img, imgW * 0.75, imgH * 1.5, imgW, imgH);
      ctx.drawImage(img, imgW * 0.75, imgH * 2.5, imgW, imgH);
      ctx.drawImage(img, imgW * 1.5, 0, imgW, imgH);
      ctx.drawImage(img, imgW * 1.5, imgH, imgW, imgH);
      ctx.drawImage(img, imgW * 1.5, imgH * 2, imgW, imgH);
    }
  }
  else {
    cnv.style.display = "none";
    cnvPlain.style.display = "";
  }
}

// when the reverse checkbox is checked or unchecked
// refreshes the preview to show the correct colors
function changeReversePreview() {
  refreshPreview();
}

// when the preview shape is changed, 
// refresh the preview 
// to display for the newly selected shape
function changePreviewShape() {
  refreshPreview();
}

// returns the currently selected preview shape
function previewShape() {
  return document.getElementById("selPreviewShape").value;
}

// displays a preview of the project 
// as it was charted
function previewAsCharted() {
  let hscale = 3;
  let wscale = 3;
  if (pattern.chartType == "S") {
    hscale = 4;
  }
  let cnvPlain = document.getElementById("cnvPlain");
  cnvPlain.width = parseInt(pattern.gridColumns, 10) * wscale;
  cnvPlain.height = parseInt(pattern.gridRows, 10) * hscale;
  let ctx = cnvPlain.getContext("2d");
  ctx.clearRect(0, 0, cnvPlain.width, cnvPlain.height);
  ctx.lineWidth = hscale;
  for (r = pattern.gridRows; r > 0; r--) {
    let y = (parseInt(pattern.gridRows, 10) - r) * hscale;
    for (c = pattern.gridColumns; c > 0; c--) {
      let td = getCell(r, c);
      let x = (parseInt(pattern.gridColumns, 10) - c) * wscale;
      let currColor = td.style.backgroundColor;
      if (isReversePreview()) {
        if (currColor == colorA) {
          currColor = colorB;
        }
        else {
          if (currColor == colorB) {
            currColor = colorA;
          }
        }
      }
      ctx.strokeStyle = currColor;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + wscale, y);
      ctx.stroke();
      ctx.closePath();
    }
  }
}

// displays a preview of the project as if
// worked in the round to form a square
function previewSquare() {
  let hscale = 6;
  let wscale = 6;
  if (pattern.chartType == "S") {
    hscale = 8;
  }
  let cnvPlain = document.getElementById("cnvPlain");
  cnvPlain.width = parseInt(pattern.gridColumns, 10) * wscale;
  cnvPlain.height = cnvPlain.width;
  let ctx = cnvPlain.getContext("2d");
  ctx.clearRect(0, 0, cnvPlain.width, cnvPlain.height);
  ctx.lineWidth = hscale;
  let transX = pattern.gridColumns * wscale / 2;
  let transY = transX;
  for (side = 1; side <= 4; side++) {
    ctx.translate(transX, transY);
    ctx.rotate(90 * Math.PI / 180);
    ctx.translate(0 - transX, 0 - transY);
    for (r = pattern.gridRows; r > 0; r--) {
      let y = (parseInt(pattern.gridRows, 10) - r) * hscale;
      for (c = pattern.gridColumns; c > 0; c--) {
        let td = getCell(r, c);
        let x = (parseInt(pattern.gridColumns, 10) - c) * wscale;
        let currColor = td.style.backgroundColor;
        if (currColor !== colorNoStitch) {
          if (isReversePreview()) {
            if (currColor == colorA) {
              currColor = colorB;
            }
            else {
              if (currColor == colorB) {
                currColor = colorA;
              }
            }
          }
          ctx.strokeStyle = currColor;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + wscale, y);
          ctx.stroke();
          ctx.closePath();
        } 
      }
    }
  }
}

// displays a preview of the project as if
// worked in the round to form a square
function previewHexagon() {
  let hscale = 6;
  let wscale = 6;
  if (pattern.chartType == "S") {
    hscale = 8;
  }
  let cnvPlain = document.getElementById("cnvPlain");
  cnvPlain.width = parseInt(pattern.gridColumns, 10) * wscale * 2;
  cnvPlain.height = parseInt(pattern.gridColumns, 10) * wscale * Math.sqrt(3);
  let ctx = cnvPlain.getContext("2d");
  ctx.clearRect(0, 0, cnvPlain.width, cnvPlain.height);
  ctx.lineWidth = hscale;
  let horizOffset = cnvPlain.width / 4;
  let transX = cnvPlain.width / 2;
  let transY = cnvPlain.height / 2;
  for (side = 1; side <= 6; side++) {
    ctx.translate(transX, transY);
    ctx.rotate(60 * Math.PI / 180);
    ctx.translate(0 - transX, 0 - transY);
    for (r = pattern.gridRows; r > 0; r--) {
      let y = (parseInt(pattern.gridRows, 10) - r) * hscale;
      for (c = pattern.gridColumns; c > 0; c--) {
        let td = getCell(r, c);
        let x = (parseInt(pattern.gridColumns, 10) - c) * wscale;
        x = x + horizOffset;
        let currColor = td.style.backgroundColor;
        if (currColor !== colorNoStitch) {
          if (isReversePreview()) {
            if (currColor == colorA) {
              currColor = colorB;
            }
            else {
              if (currColor == colorB) {
                currColor = colorA;
              }
            }
          }
          ctx.strokeStyle = currColor;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + wscale, y);
          ctx.stroke();
          ctx.closePath();
        }
      }
    }
  }
}

// when changes are made to the chart
// refreshes the preview of the project
function refreshPreview() {
  switch (previewShape()) {
    case "":
      //as charted
      previewAsCharted();
      break;
    case "S":
      //square
      previewSquare();
      break;
    case "H":
      //hexagon
      previewHexagon();
      break;
  }
  tilePreview();
}

// -- instructions --

// adds the specified cell to the temporary grid in memory
// row - row of the cell
// column - column of the cell
// color - color of the cell
// arrGrid - temporary grid in memory
// used when importing from instructions
function addCellToGrid(row, column, color, arrGrid) {
  let cell = {
    row: row,
    column: column,
    color: color
  }
  arrGrid.push(cell);
}

// inserts a column of "no stitches" below the specified cell in the temporary grid in memory
// row - row of the cell
// column - column of the cell
// arrGrid - temporary grid in memory
// used when importing from instructions, when working an increase
// the column extends down until it reaches an existing "no stitch" or the bottom row
function insertNoStitchBelow(row, column, arrGrid) {
  let minR = 1;
  for (cnr = row - 1; cnr > 0; cnr--) {
    minR = cnr;
    let checkCellNoStitch = arrGrid.find((cell) => cell.row == cnr && cell.column == column);
    if (checkCellNoStitch !== undefined && checkCellNoStitch.color == colorNoStitch) {
      minR = r + 1;
      break;
    }
  }
  for (snr = minR; snr < row; snr++) {
    let arrAfterNoStitchCells = arrGrid.filter((cell) => cell.row == snr && cell.column >= column);
    for (anc = 0; anc < arrAfterNoStitchCells.length; anc++) {
      arrAfterNoStitchCells[anc].column = parseInt(arrAfterNoStitchCells[anc].column, 10) + 1;
    }
    addCellToGrid(snr, column, colorNoStitch, arrGrid);
  }
}

// finds the repeats (use of the word "times") in the instructions and expands them out
// so that the instruction is repeated the specified number of times
// instructions - text of the instructions to expand
function expandInstructionTimes(instructions) {
  let iTimes = instructions.indexOf("times");
  while (iTimes > -1) {
    let tempText = instructions.substring(0, iTimes + "times".length);
    let iBegParen = tempText.lastIndexOf("(");
    let iEndParen = tempText.lastIndexOf(")");
    let rptText = tempText.substring(iBegParen + 1, iEndParen);
    let rptTimes = parseInt(tempText.substring(iEndParen + 1, iTimes), 10);
    let oldText = tempText.substring(iBegParen);
    let newText = "";
    for (x = 1; x <= rptTimes; x++) {
      newText = newText + rptText;
      if (x < rptTimes) {
        newText = newText + ", ";
      }
    }
    instructions = instructions.replace(oldText, newText);
    iTimes = instructions.indexOf("times");
  }
  return instructions;
}

// splits out the text for a stitch instruction
// into the number of stitches and their type
// stitchText - the text of the stitch instruction
// returns:
// stitchNumber - the number of stitches to do
// stitchType - the type of stitches to do
function splitStitchText(stitchText) {
  stitchText = stitchText.trim();
  let stitchInstructions = {
    stitchNumber: parseInt(stitchText, 10),
    stitchType: plain
  }
  switch (stitchText.substring(stitchText.length - 1)) {
    case overlay:
      stitchInstructions.stitchType = overlay;
      break;
    case increase:
      stitchInstructions.stitchType = increase;
      break;
    case decrease:
      stitchInstructions.stitchType = decrease;
      break;
  }
  return stitchInstructions;
}

// reads the shaping (increases/decreases) from the beginning of each row
// adjusts the beginning of each row accordingly and
// returns the starting column (first cell that is not "no stitch") for each row
// arrRow - array of instructions for each row
// returns:
// array of row and startColumn
function readShaping(arrRow) {
  let arrRowStarts = new Array();
  for (r = 1; r <= arrRow.length - 1; r++) {
    let rowText = arrRow[r].split(":")[1];
    let arrStitchText = rowText.split(",");
    if (arrRow[r].indexOf("WS") > -1) {
      arrStitchText.reverse();
    }
    let firstSts = arrStitchText[0].trim();
    let stitchInstructions = splitStitchText(firstSts);
    if (r == 1) {
      let row = {
        row: r,
        startColumn: 1
      }
      arrRowStarts.push(row)
    }
    else {
      let startColumn = arrRowStarts.find((rs) => rs.row == r - 1).startColumn;
      if (stitchInstructions.stitchType == decrease) {
        startColumn = startColumn + stitchInstructions.stitchNumber;
      } 
      if (stitchInstructions.stitchType == increase) {
        startColumn = startColumn - stitchInstructions.stitchNumber;
      }     
      let row = {
        row: r,
        startColumn: startColumn
      }
      arrRowStarts.push(row)
    }
  }
  arrRowStarts.sort((a,b) => a.startColumn - b.startColumn);
  let minStart = arrRowStarts[0].startColumn;
  if (minStart < 1) {
    let colOffset = Math.abs(minStart) + 1;
    for (i = 0; i < arrRowStarts.length; i++) {
      arrRowStarts[i].startColumn = arrRowStarts[i].startColumn  + colOffset;
    }
  }
  return arrRowStarts;
}

// virtually works the rows in the specified instructions
// into the specified temporary grid in memory
// arrRow - array of instructions for each row
// arrRowStarts - array of row and startColumn for the row
// arrGrid - temporary grid in memory to work into
function workRows(arrRow, arrRowStarts, arrGrid) {
  for (r = 1; r <= arrRow.length - 1; r++) {
    let rowColor = colorA;
    if (r % 2 == 0) {
      rowColor = colorB;
    }
    let startColumn = arrRowStarts.find((rs) => rs.row == r).startColumn;
    for (i = 1; i < startColumn; i++) {
      addCellToGrid(r, i, colorNoStitch, arrGrid);
    }
    let rowText = arrRow[r].split(":")[1];
    let arrStitchText = rowText.split(",");
    if (arrRow[r].indexOf("WS") > -1) {
      arrStitchText.reverse();
    }
    let currColumn = parseInt(startColumn, 10);
    for (s = 0; s < arrStitchText.length; s++) {
      let stitchInstructions = splitStitchText(arrStitchText[s]);
      if (stitchInstructions.stitchType == increase) {
        for (si = 0; si < stitchInstructions.stitchNumber; si++) {
          insertNoStitchBelow(r, currColumn + si, arrGrid);
          addCellToGrid(r, currColumn + si, rowColor, arrGrid);
        }
        if (s > 0) {
          currColumn = currColumn + stitchInstructions.stitchNumber;
        }
      }
      else {
        let cellBelow = arrGrid.find((cell) => cell.row == r - 1 && cell.column == currColumn);
        while (cellBelow !== undefined && cellBelow.color == colorNoStitch) {
          addCellToGrid(r, currColumn, colorNoStitch, arrGrid);
          currColumn = currColumn + 1;
          cellBelow = arrGrid.find((cell) => cell.row == r - 1 && cell.column == currColumn);
        }
        for (i = 0; i < stitchInstructions.stitchNumber; i++) {
          if (stitchInstructions.stitchType == decrease) {
            if (s > 0) {
              addCellToGrid(r, currColumn + i, colorNoStitch, arrGrid);
            }
          }
          else {
            addCellToGrid(r, currColumn + i, rowColor, arrGrid);
          }
          if (stitchInstructions.stitchType == overlay) {
            cellBelow = arrGrid.find((cell) => cell.row == r - 1 && cell.column == currColumn + i);
            if (cellBelow !== undefined && cellBelow.color !== colorNoStitch) {
              cellBelow.color = rowColor;
            }
          }
        }
        if (stitchInstructions.stitchType !== decrease || s > 0) {
          currColumn = currColumn + stitchInstructions.stitchNumber;
        }
      }
    }
    let cellBelow = arrGrid.find((cell) => cell.row == r - 1 && cell.column == currColumn);
    while (cellBelow !== undefined && cellBelow.color == colorNoStitch) {
      addCellToGrid(r, currColumn, colorNoStitch, arrGrid);
      currColumn = currColumn + 1;
      cellBelow = arrGrid.find((cell) => cell.row == r - 1 && cell.column == currColumn);
    }
    //alert(JSON.stringify(arrGrid.filter((cell) => cell.row == r)));
  }
}

// where the instructions should be imported to
// returns the destination currently selected in the dropdown
// empty string - overwrite the existing chart
// C - import to clipboard
function importInstructionsTo() {
  return document.getElementById("selImportInstructionsTo").value;
}

// reset the edge columns in the specified array of cells to colorA
// arrGrid - array of cells (with row, column, and color properties)
// maxGridRows - maximum row number of a cell in the array
// maxGridColumns - maximum column number of a cell in the array
// used when importing instructions to the clipboard to avoid pasting edge stitches
function resetEdgeColumnsInArray(arrGrid, maxGridRows, maxGridColumns) {
  for (r = 1; r <= maxGridRows; r++) {
    for (c = 1; c <= maxGridColumns; c++) {
      let cell = arrGrid.find((cell) => cell.row == r && cell.column == c);
      if (cell !== undefined && cell.color !== colorNoStitch) {
        cell.color = colorA;
        break;
      }
    }
    for (c = maxGridColumns; c >= 1; c--) {
      let cell = arrGrid.find((cell) => cell.row == r && cell.column == c);
      if (cell !== undefined && cell.color !== colorNoStitch) {
        cell.color = colorA;
        break;
      }
    }
  }
}

// when the import button in the instructions section is clicked,
// imports the instructions entered in the instructions text area
function importInstructions() {
  let instructions = document.getElementById("txtInstructions").value;
  if (importInstructionsTo() !== "" || clearChart()) {
    instructions = expandInstructionTimes(instructions);
    let arrRow = instructions.split("row ");
    let importGridRows = arrRow.length - 1;
    let importGridColumns = 1;
    let arrRowStarts = readShaping(arrRow);
    let arrGrid = new Array();
    workRows(arrRow, arrRowStarts, arrGrid);
    if (arrGrid.length > 0) {
      arrGrid.sort((a,b) => b.column - a.column);
      importGridColumns = arrGrid[0].column;
    }  
    arrGrid.sort((a,b) => a.column - b.column);
    arrGrid.sort((a,b) => a.row - b.row);
    if (importInstructionsTo() == "") {
      pattern.gridRows = importGridRows;
      pattern.gridColumns = importGridColumns;
      loadChart();
      for (i = 0; i < arrGrid.length; i++) {
        let td = getCell(arrGrid[i].row, arrGrid[i].column);
        td.style.backgroundColor = arrGrid[i].color;
      }
      addXs();
      savePattern();
      restorePattern();
      loadChart();
      refreshPreview();
      writeInstructions();
    }
    else {
      resetEdgeColumnsInArray(arrGrid, importGridRows, importGridColumns);
      document.getElementById("selMode").value = "S";
      arrGrid.sort((a,b) => b.column - a.column);
      arrGrid.sort((a,b) => b.row - a.row);
      selection.cells = arrGrid;
      alert("Imported to clipboard.  Select an area in the chart and choose a paste option.");
    }
  }
}

// when changes are made to the chart,
// writes the instructions for the project
function writeInstructions() {
  let txtInstructions = document.getElementById("txtInstructions");
  let instruct = "";

  for (r = 1; r <= pattern.gridRows; r++) {
    let rowColor = "A";
    if (r % 2 == 0) {
      rowColor = "B";
    }
    let patternRow = (r * 2) - 1;
    if (pattern.chartType == "C" || pattern.chartType == "CR") {
      patternRow = r;
    }
    instruct = instruct + "row " + patternRow + " (color " + rowColor;
    if (pattern.chartType == "C") {
      if (r % 4 == 1 || r % 4 == 2) {
        instruct = instruct + ", RS";
      }
      else {
        instruct = instruct + ", WS";
      }
    }
    else {
      instruct = instruct + ", RS";
    }
    instruct = instruct + "): "

    let arrSts = new Array();
    for (c = 1; c <= pattern.gridColumns; c++) {
      let txt = plain;
      let td = getCell(r, c);
      let currColor = td.style.backgroundColor;
      if (td.innerHTML == overlay) {
        txt = overlay;
      }
      if (r > 1) {
        let tdBelow = getCell(r - 1, c);
        let belowColor = currColor;
        if (tdBelow !== null) {
          belowColor = tdBelow.style.backgroundColor;
        }
        if (currColor == colorNoStitch && belowColor !== colorNoStitch) {
          txt = decrease;
        }
        if (currColor !== colorNoStitch && belowColor == colorNoStitch) {
          txt = increase;
        }
      }
      if (currColor !== colorNoStitch || txt !== "") {
        let st = {
          "num": 1,
          "txt": txt
        };
        arrSts.push(st);
      }
    }
    if (pattern.chartType == "C" && (r % 4 == 3 || r % 4 == 0)) {
      arrSts.reverse();
    }
    instruct = instruct + convertRow(arrSts);
    instruct = instruct + "\n";
  }
  txtInstructions.value = instruct;
}

// converts the specified array of stitch instructions
// into the instructions for the row, collapsing any repeating instructions
// arrSts - array of stitch instructions
// returns text of the instructions for the row
function convertRow(arrSts) {
  arrSts = sumSts(arrSts);
  arrSts = concatSts(arrSts);
  arrSts = concatSingles(arrSts);
  arrSts = sumSts(arrSts);

  while (arrSts.some(st => st.num > 1)) {
    arrSts = convertToSingle(arrSts);
    arrSts = concatSingles(arrSts);
    arrSts = sumSts(arrSts);
  }

  let txt = "";
  for (s = 0; s < arrSts.length; s++) {
    txt = txt + arrSts[s].txt;
    if (s < arrSts.length - 1) {
      txt = txt + ", ";
    }
  }
  return txt;
}

// looks for a stitch instruction that 
// matches the following stitch instruction
// and collapses them into a repeating stitch instruction within the array
// arrSts - array of stitch instructions
function sumSts(arrSts) {
  for (s = 1; s < arrSts.length; s++) {
    if (arrSts[s].num > 0 && arrSts[s].txt == arrSts[s - 1].txt) {
      arrSts[s].num = arrSts[s].num + arrSts[s - 1].num;
      arrSts[s - 1].num = 0;
      arrSts[s - 1].txt = "";
    }
  }
  return removeEmpty(arrSts);
}

// removes any empty entries from the specified array of stitch instructions
// arrSts - array of stitch instructions
// entries may become empty when repeats are identified in sumSts
function removeEmpty(arrSts) {
  let arrReturn = new Array();
  for (s = 0; s < arrSts.length; s++) {
    if (arrSts[s].num > 0) {
      arrReturn.push(arrSts[s]);
    }
  }
  return arrReturn;
}

// concat the number of stitches with the type of stitch
// in the specified array of stitch instructions
// arrSts - array of stitch instructions
// only happens once at the beginning of converting a row
function concatSts(arrSts) {
  for (s = 0; s < arrSts.length; s++) {
    arrSts[s].txt = arrSts[s].num + arrSts[s].txt;
    arrSts[s].num = 1;
  }
  return arrSts;
}

// converts a repeating section of stitch instructions
// into a single entry in the array of stitch instructions
// arrSts - array of stitch instructions
function convertToSingle(arrSts) {
  for (s = 0; s < arrSts.length; s++) {
    if (arrSts[s].num > 1) {
      arrSts[s].txt = "(" + arrSts[s].txt + ") " + arrSts[s].num + " times";
      arrSts[s].num = 1;
    }
  }
  return arrSts;
}

// where there are two single stitch instructions next to each other
// (that don't match each other) concat the two instructions together
// so that sumSts can check for repeating sections of instructions
// where maybe these pairs of instructions repeat
function concatSingles(arrSts) {
  for (s = 1; s < arrSts.length; s++) {
    if (arrSts[s].num == 1 && arrSts[s - 1].num == 1) {
      arrSts[s - 1].txt = arrSts[s - 1].txt + ", " + arrSts[s].txt;
      arrSts[s - 1].num = 1;
      arrSts[s].num = 0;
      arrSts[s].txt = "";
    }
  }
  return removeEmpty(arrSts);
}

// -- save/restore/load chart --

// saves the current chart to local storage
// but saves a copy of the old chart first to facilitate undo
function savePattern() {
  let cellsColorB = new Array();
  let cellsNoStitch = new Array();
  for (r = pattern.gridRows; r >= 1; r--) {
    for (c = pattern.gridColumns ; c >= 1; c--) {
      let td = getCell(r, c);
      if (td !== null) {
        let tdColor = td.style.backgroundColor;
        if (tdColor == colorB) {
          cellsColorB.push(td.id);
        }
        if (tdColor == colorNoStitch) {
          cellsNoStitch.push(td.id);
        }
      }
    }
  }
  pattern.cellsColorB = cellsColorB;
  pattern.cellsNoStitch = cellsNoStitch;
  if (localStorage.getItem("pattern") !== null && localStorage.getItem("pattern") !== JSON.stringify(pattern)) {
    localStorage.setItem("patternUndo", localStorage.getItem("pattern"));
  }
  localStorage.setItem("pattern", JSON.stringify(pattern));
}

// retrieves the current pattern from local storage
function restorePattern() {
  if (localStorage.getItem("pattern") !== null) {
    pattern = JSON.parse(localStorage.getItem("pattern"));
  }
  document.getElementById("selChartType").value = pattern.chartType;
  document.getElementById("txtGridColumns").value = pattern.gridColumns;
  document.getElementById("txtGridRows").value = pattern.gridRows;
  if (pattern.font == undefined) {
    resetFont();
  }
  writeFontInstructions();
}

function readFont(fontInstruct) {
  let arrFontInstruct = fontInstruct.split("\n");
  let arrFont = new Array();
  let maxFontRows = 0;
  for (f = 0; f < arrFontInstruct.length; f++) {
    let fontInstruct = arrFontInstruct[f].trim();
    if (fontInstruct.indexOf(":") > -1) {

      let fontEntry = {
        letter: fontInstruct.split(":")[0],
        instructions: fontInstruct.split(":")[1].trim()
      }
      if (fontInstruct.substring(0,2) == "::") {
        fontEntry.letter = ":";
        fontEntry.instructions = arrFontInstruct[f].split(":")[2].trim();
      }
      else {
        if (fontInstruct.substring(0,1) == ":") {
          fontEntry.letter = " ";
        }
      }
      if (fontEntry.instructions.split(";").length > maxFontRows) {
        maxFontRows = fontEntry.instructions.split(";").length;
      }
      arrFont.push(fontEntry);
    }
  }
  // must end on odd row
  if (maxFontRows % 2 == 0) { 
    maxFontRows = maxFontRows + 1;
  }
  // make sure all font entries have the same number of rows
  for (f = 0; f < arrFont.length; f++) {
    let fontEntry = arrFont[f];
    let startRow = fontEntry.instructions.split(";").length + 1;
    let addCols = fontEntry.instructions.split(";")[0];
    for (ar = startRow; ar <= maxFontRows; ar++) {
      if (ar % 2 == 0) {
        fontEntry.instructions = fontEntry.instructions + "; " + addCols;
      }
      else {
        fontEntry.instructions = fontEntry.instructions + "; " + addCols + overlay;
      }
    }
  }
  pattern.font = arrFont;
  savePattern();
}

function resetFont() {
  if (confirm("okay to overwrite current font with the built-in default font?")) {
    let hidFont = document.getElementById("hidFont");
    readFont(hidFont.value);
  }
  writeFontInstructions();
}

function importFont() {
  if (confirm("okay to overwrite current font with the imported font?")) {
    let txtFont = document.getElementById("txtFont");
    readFont(txtFont.value);
  }
  writeFontInstructions();
}

function importText() {
  let kern = document.getElementById("txtKern").value;
  if (parseInt(kern, 10) < 1) {
    kern = 1;
  }
  if (pattern.font.length == 0) {
    resetFont();
  }
  let fontEntry = pattern.font.find((fe) => fe.letter == " ");
  if (fontEntry == undefined) {
    fontEntry = {
      letter: " ",
      instructions: "3"
    }
    pattern.font.push(fontEntry);
  }
  writeFontInstructions();
  let txtFont = document.getElementById("txtFont");
  readFont(txtFont.value);
  let textInstruct = "";
  let fontHeight = pattern.font[0].instructions.split(";").length;
  let txtText = document.getElementById("txtText");
  let arrText = txtText.value.split("\n");
  let row = 1;
  for (t = arrText.length - 1; t >= 0; t--) {
    for (r = 0; r < fontHeight; r++) {
      textInstruct = textInstruct + "row " + row + ": ";
      
      for (s = arrText[t].length - 1; s >= 0; s --) {
        let letter = arrText[t].substring(s, s+1);
        fontEntry = pattern.font.find((fe) => fe.letter.charCodeAt(0) == letter.charCodeAt(0));
        if (fontEntry == undefined) {
          fontEntry = pattern.font.find((fe) => fe.letter == " ");
        }
        if (s == arrText[t].length - 1) {
          if (row != 1 && row % 2 != 0) {
            textInstruct = textInstruct + kern + overlay;
          }
          else {
            textInstruct = textInstruct + kern;
          }
        }
        textInstruct = textInstruct + ", " + fontEntry.instructions.split(";")[r];
        if (row != 1 && row % 2 != 0) {
          textInstruct = textInstruct + ", " + kern + overlay;
        }
        else {
          textInstruct = textInstruct + ", " + kern;
        }
      }
      textInstruct = textInstruct + "\n";
      row = row + 1;
    }
    if (t != 0) {
      textInstruct = textInstruct + "row " + row + ": 1" + "\n";
      row = row + 1;
    }
  }
  if (row % 2 != 0) {
    textInstruct = textInstruct + "row " + row + ": 1" + "\n";
  }
  let txtInstructions = document.getElementById("txtInstructions");
  txtInstructions.value = textInstruct;
  let selImportInstructionsTo = document.getElementById("selImportInstructionsTo");
  let selImportTextTo = document.getElementById("selImportTextTo");
  selImportInstructionsTo.value = selImportTextTo.value;
  importInstructions();
}

// loads the chart based on the pattern global variable
function loadChart() {
  let tblChart = document.getElementById("tblChart");
  tblChart.innerHTML = "";
  let thead = tblChart.createTHead();
  let row = thead.insertRow();
  let td = document.createElement("td");
  let text = document.createTextNode("");
  td.appendChild(text);
  row.appendChild(td);

  for (c = pattern.gridColumns; c > 0; c--) {
    td = document.createElement("td");
    let colNum = c;
    if (pattern.chartType == "C") {
      colNum = parseInt(pattern.gridColumns, 10) - colNum + 1;
    }
    text = document.createTextNode(colNum);
    td.appendChild(text);
    row.appendChild(td);
  }

  td = document.createElement("td");
  text = document.createTextNode("");
  td.appendChild(text);
  row.appendChild(td);

  for (r = pattern.gridRows; r > 0; r--) {
    row = thead.insertRow();
    td = document.createElement("td");
    let rowColor = "A";
    if (r % 2 == 0) {
      rowColor = "B";
    }
    text = document.createTextNode(rowColor);
    if (pattern.chartType == "C") {
      text = document.createTextNode("");
      if (r % 4 == 3 || r % 4 == 0) {
        text = document.createTextNode(r);
      }
    }

    td.appendChild(text);
    row.appendChild(td);

    for (c = pattern.gridColumns; c > 0; c--) {
      td = document.createElement("td");
      text = document.createTextNode("");
      td.appendChild(text);
      td.setAttribute("onclick", "clickCell(this);");
      if (pattern.chartType == "S") {
        td.classList.add("stst");
      }
      td.id = "_" + r + "_" + c;
      td.style.backgroundColor = colorA;
      row.appendChild(td);
    }

    td = document.createElement("td");
    switch (pattern.chartType) {
      case "CR":
        text = document.createTextNode(r);
        break;
      case "C":
        if (r % 4 == 1 || r % 4 == 2) {
          text = document.createTextNode(r);
        }
        break;
      case "G":
      case "S":
        text = document.createTextNode(((r * 2) - 1));
        break;
    }
    td.appendChild(text);
    row.appendChild(td);
  }

  row = thead.insertRow();
  td = document.createElement("td");
  text = document.createTextNode("");
  td.appendChild(text);
  row.appendChild(td);
  for (c = pattern.gridColumns; c > 0; c--) {
    td = document.createElement("td");
    text = document.createTextNode(c);
    td.appendChild(text);
    row.appendChild(td);
  }
  td = document.createElement("td");
  text = document.createTextNode("");
  td.appendChild(text);
  row.appendChild(td);

  for (i = 0; i < pattern.cellsColorB.length; i++) {
    td = document.getElementById(pattern.cellsColorB[i]);
    if (td !== null) {
      td.style.backgroundColor = colorB;
    }
  }
  for (i = 0; i < pattern.cellsNoStitch.length; i++) {
    td = document.getElementById(pattern.cellsNoStitch[i]);
    if (td !== null) {
      td.style.backgroundColor = colorNoStitch;
    }
  }
  addXs();
}

addEventListener('load', restorePattern());
addEventListener('load', loadChart());
addEventListener('load', refreshPreview());
addEventListener('load', writeInstructions());

// when an image is selected, gets a hidden copy of the image for upload
window.addEventListener('load', function () {
  document.getElementById("fleImage").addEventListener("change", function () {
    if (this.files && this.files[0]) {
      var img = document.getElementById("imgImport");
      img.onload = () => {
        URL.revokeObjectURL(img.src);
      }
      img.src = URL.createObjectURL(this.files[0]);
    }
  });
});