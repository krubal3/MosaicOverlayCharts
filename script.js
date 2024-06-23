var pattern = {
  chartType: "G",
  gridColumns: 31,
  gridRows: 31,
  cellsColorB: [],
  cellsNoStitch: []
};
var colorA = "white";
var colorB = "silver";
var colorNoStitch = "gainsboro";
var maxGridColumns = 999;
var maxGridRows = 999;
var selection = {
  fromId: "",
  toId: "",
  cells: [],
  action: ""
};
var plain = "";
var overlay = "X";
var increase = "+";
var decrease = "-";

function getCell(row, column) {
  let td = document.getElementById("_" + row + "_" + column);
  return td;
}

function changeChartType(chartType) {
  pattern.chartType = chartType;
  savePattern();
  loadChart();
  refreshPreview();
  writeInstructions();
}

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

function changeMode() {
  clearSelection();
  selection.fromId = "";
  selection.toId = "";
  selection.cells = [];
  selection.action = "";
  let divSelectionMenu = document.getElementById("divSelectionMenu");
  divSelectionMenu.style.display = "none";
}

function getIdRange(fromId, toId) {
  let fromIds = splitId(fromId);
  let toIds = splitId(toId);

  let maxR = toIds.row;
  let minR = fromIds.row;
  if (parseInt(maxR, 10) < parseInt(minR, 10)) {
    maxR = fromIds.row;
    minR = toIds.row;
  }
  if (maxR % 2 !== 0) {
    maxR = maxR - 1;
  }
  if (minR % 2 !== 0) {
    minR = minR - 1;
  }
  if (minR < 1) {
    minR = 1;
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

function hideSelection() {
  let idRange = getIdRange(selection.fromId, selection.toId);
  for (r = idRange.minR; r <= idRange.maxR; r++) {
    for (c = idRange.minC; c <= idRange.maxC; c++) {
      let td = getCell(r, c);
      td.style.borderColor = "";
    }
  }
}

function clearSelection() {
  hideSelection();
  selection.fromId = "";
  selection.toId = "";
  selection.cells = [];
}

function drawLine(fromR, fromC, toR, toC) {
  let slope = 0;
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
        placePoint(r, fromC, colorB);
      }
    }
    else {
      for (c = minC; c <= maxC; c++) {
        placePoint(fromR, c, colorB);
      }
    }
  }
  else {
    for (c = minC; c <= maxC; c++) {
      let r = Math.round((slope * c) + yIntercept);
      placePoint(r, c, colorB);
    }
    for (r = minR; r <= maxR; r++) {
      let c = Math.round((r - yIntercept) / slope);
      placePoint(r, c, colorB);
    }
  }
}

function placePoint(r, c, setColor) {
  let td = getCell(r, c);
  if (td !== null) {
    if (td.style.backgroundColor !== colorNoStitch || isShaping()) {
      td.style.backgroundColor = setColor;
    }
    if (setColor !== colorNoStitch) {
      if ((setColor == colorA && r % 2 == 0) || (setColor == colorB && r % 2 !== 0)) {
        td = getCell(r - 1, c);
        if (td !== null && td.style.backgroundColor !== colorNoStitch) {
          td.style.backgroundColor = setColor;
        }
        td = getCell(r + 1, c);
        if (td !== null && td.style.backgroundColor !== colorNoStitch) {
          td.style.backgroundColor = setColor;
        }
      }
    }
  }
}

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

function selectShape(selShape) {
  let idRange = getIdRange(selection.fromId, selection.toId);
  switch (selShape.value) {
    case "|":
      drawLine(idRange.minR, idRange.maxC, idRange.maxR, idRange.maxC);
      break;
    case "_":
      drawLine(idRange.minR, idRange.minC, idRange.minR, idRange.maxC);
      break;
    case "/":
      drawLine(idRange.maxR, idRange.minC, idRange.minR, idRange.maxC);
      break;
    case "\\":
      drawLine(idRange.minR, idRange.minC, idRange.maxR, idRange.maxC);
      break;
    case "R":
      drawLine(idRange.minR, idRange.maxC, idRange.maxR, idRange.maxC);
      drawLine(idRange.maxR, idRange.minC, idRange.maxR, idRange.maxC);
      drawLine(idRange.minR, idRange.minC, idRange.maxR, idRange.minC);
      drawLine(idRange.minR, idRange.minC, idRange.minR, idRange.maxC);
      break;
    case "C":
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

function selectCutCopy(selCutCopy) {
  let idRange = getIdRange(selection.fromId, selection.toId);

  let arrCells = new Array();
  for (r = pattern.gridRows; r > 1; r--) {
    for (c = pattern.gridColumns - 1; c > 1; c--) {
      let gridTd = getCell(r, c);
      gridTd.style.borderColor = "";
      if (selCutCopy.value !== "cancel" && r >= idRange.minR && r <= idRange.maxR && c >= idRange.minC && c <= idRange.maxC) {
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
  if (selCutCopy.value !== "cancel") {
    selection.cells = arrCells;
  }

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

function selectPaste(selPaste) {
  let idRange = getIdRange(selection.fromId, selection.toId);
  let rowOffset = idRange.maxR - selection.cells[0].row;
  let colOffset = idRange.maxC - selection.cells[0].column;
  let fromWidth = selection.cells[0].column - selection.cells[selection.cells.length - 1].column;
  let fromHeight = selection.cells[0].row - selection.cells[selection.cells.length - 1].row;
  let toWidth = idRange.maxC - idRange.minC + 1;
  let toHeight = idRange.maxR - idRange.minR + 1;
  if (selPaste.value == "center") {
    rowOffset = rowOffset - Math.round(toHeight / 2);
    rowOffset = rowOffset + Math.round(fromHeight / 2)
    colOffset = colOffset - Math.round(toWidth / 2);
    colOffset = colOffset + Math.round(fromWidth / 2);
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

function importImage() {
  if (clearChart()) {
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
    pattern.gridColumns = cnvPlain.width;
    pattern.gridRows = cnvPlain.height;
    loadChart();

    for (r = pattern.gridRows - 1; r > -1; r--) {
      for (c = pattern.gridColumns - 1; c > -1; c--) {

        let redComp = imageData.data[((r * (cnvPlain.width * 4)) + (c * 4))];
        let greenComp = imageData.data[((r * (cnvPlain.width * 4)) + (c * 4)) + 1];
        let blueComp = imageData.data[((r * (cnvPlain.width * 4)) + (c * 4)) + 2];
        let trans = imageData.data[((r * (cnvPlain.width * 4)) + (c * 4)) + 3];
        let avg = (redComp + greenComp + blueComp) / 3

        if (trans > 0 && avg < 200) {
          let currR = pattern.gridRows - r;
          let currC = pattern.gridColumns - c;
          placePoint(currR, currC, colorB);
        }
      }
    }
    addXs();
    savePattern();
    restorePattern();
    loadChart();
    refreshPreview();
    writeInstructions();
  }
}

function splitId(id) {
  let ids = id.split("_");
  let r = parseInt(ids[1], 10);
  let c = parseInt(ids[2], 10);
  return {
    row: r,
    column: c
  }
}

function insertNoStitchBelow(row, column, arrGrid) {
  let minR = 1;
  for (r = row - 1; r > 0; r--) {
    minR = r;
    let cellBelow = arrGrid.find((cell) => cell.row == r && cell.column == column);
    if (cellBelow !== undefined && cellBelow.color == colorNoStitch) {
      minR = r + 1;
      break;
    }
  }
  for (r = minR; r < row; r++) {
    let arrCells = arrGrid.filter((cell) => cell.row == r && cell.column >= column);
    for (i = 0; i < arrCells.length; i++) {
      arrCells[i].column = arrCells[i].column + 1;
    }
    let cell = {
      row: r,
      column: column,
      color: colorNoStitch
    }
    arrGrid.push(cell);
  }
}

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

function splitStitchText(stitchText) {
  stitchText = stitchText.trim();
  let stitchInstructions = {
    stitchNumber: parseInt(stitchText, 10),
    stitchType: ""
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

function readShaping(arrRow, arrRowStarts) {
  for (r = 1; r <= pattern.gridRows; r++) {
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
}

function workRows(arrRow, arrRowStarts, arrGrid) {
  for (r = 1; r <= pattern.gridRows; r++) {
    let rowColor = colorA;
    if (r % 2 == 0) {
      rowColor = colorB;
    }
    let startColumn = arrRowStarts.find((rs) => rs.row == r).startColumn;
    for (i = 1; i < startColumn; i++) {
      let cell = {
        row: r,
        column: i,
        color: colorNoStitch
      }
      arrGrid.push(cell);
    }
    let rowText = arrRow[r].split(":")[1];
    let arrStitchText = rowText.split(",");
    if (arrRow[r].indexOf("WS") > -1) {
      arrStitchText.reverse();
    }
    let currColumn = startColumn;
    for (s = 0; s < arrStitchText.length; s++) {
      let stitchInstructions = splitStitchText(arrStitchText[s]);
      if (stitchInstructions.stitchType == increase) {
        for (i = 0; i < stitchInstructions.stitchNumber; i++) {
          insertNoStitchBelow(r, currColumn + i, arrGrid);
          let cell = {
            row: r,
            column: currColumn + i,
            color: rowColor
          }
          arrGrid.push(cell);
        }
      }
      else {
        let cellBelow = arrGrid.find((cell) => cell.row == r - 1 && cell.column == currColumn);
        while (cellBelow !== undefined && cellBelow.color == colorNoStitch) {
          let cell = {
            row: r,
            column: currColumn,
            color: colorNoStitch
          }
          arrGrid.push(cell);
          currColumn = currColumn + 1;
          cellBelow = arrGrid.find((cell) => cell.row == r - 1 && cell.column == currColumn);
        }
        for (i = 0; i < stitchInstructions.stitchNumber; i++) {
          let stColor = rowColor;
          if (stitchInstructions.stitchType == decrease) {
            stColor = colorNoStitch;
          }
          let cell = {
            row: r,
            column: currColumn + i,
            color: stColor
          }
          arrGrid.push(cell);
          if (stitchInstructions.stitchType == overlay) {
            cellBelow = arrGrid.find((cell) => cell.row == r - 1 && cell.column == currColumn + i);
            if (cellBelow !== undefined && cellBelow.color !== colorNoStitch) {
              cellBelow.color = rowColor;
            }
          }
        }
      }
      currColumn = currColumn + stitchInstructions.stitchNumber;
    }
  }
}

function importInstructions() {
  let instructions = document.getElementById("txtInstructions").value;
  if (clearChart()) {
    instructions = expandInstructionTimes(instructions);
    let arrRow = instructions.split("row ");
    pattern.gridRows = arrRow.length - 1;
    pattern.gridColumns = 1;
    let arrRowStarts = new Array();
    readShaping(arrRow, arrRowStarts);
    let arrGrid = new Array();
    workRows(arrRow, arrRowStarts, arrGrid);
    if (arrGrid.length > 0) {
      arrGrid.sort((a,b) => b.column - a.column);
      pattern.gridColumns = arrGrid[0].column;
    }  
    arrGrid.sort((a,b) => a.column - b.column);
    arrGrid.sort((a,b) => a.row - b.row);
    loadChart();
    for (i = 0; i < arrGrid.length; i++) {
      let td = getCell(arrGrid[i].row, arrGrid[i].column);
      td.style.backgroundColor = arrGrid[i].color;
    }
    addXs();
    savePattern();
    refreshPreview();
    writeInstructions();
    alert("Imported");
  }
}

function refreshPreview() {
  let hscale = 3;
  let wscale = 3;
  if (pattern.chartType == "S") {
    hscale = 4;
  }
  var cnvPlain = document.getElementById("cnvPlain");
  cnvPlain.width = parseInt(pattern.gridColumns, 10) * wscale;
  cnvPlain.height = parseInt(pattern.gridRows, 10) * hscale;
  var ctx = cnvPlain.getContext("2d");
  ctx.clearRect(0, 0, cnvPlain.width, cnvPlain.height);
  ctx.lineWidth = hscale;

  var cnvReverse = document.getElementById("cnvReverse");
  cnvReverse.width = parseInt(pattern.gridColumns, 10) * wscale;
  cnvReverse.height = parseInt(pattern.gridRows, 10) * hscale;
  var ctxRev = cnvReverse.getContext("2d");
  ctxRev.clearRect(0, 0, cnvReverse.width, cnvReverse.height);
  ctxRev.lineWidth = hscale;

  var cnvStripe = document.getElementById("cnvStripe");
  cnvStripe.width = parseInt(pattern.gridColumns, 10) * wscale;
  cnvStripe.height = parseInt(pattern.gridRows, 10) * hscale;
  var ctxStr = cnvStripe.getContext("2d");
  ctxStr.clearRect(0, 0, cnvStripe.width, cnvStripe.height);

  ctxStr.strokeStyle = "silver";
  ctxStr.lineWidth = hscale / 2;
  for (r = pattern.gridRows; r > 0; r--) {
    let y = (parseInt(pattern.gridRows, 10) - r) * hscale;
    if (y % 4 == 0) {
      ctxStr.beginPath();
      ctxStr.moveTo(0, y);
      ctxStr.lineTo((pattern.gridColumns - 1) * wscale, y);
      ctxStr.stroke();
      ctxStr.closePath();
    }
  }

  ctxStr.strokeStyle = "black";
  ctxStr.lineWidth = hscale;
  for (r = pattern.gridRows; r > 0; r--) {
    let y = (parseInt(pattern.gridRows, 10) - r) * hscale;
    for (c = pattern.gridColumns; c > 0; c--) {
      let td = getCell(r, c);
      let x = (parseInt(pattern.gridColumns, 10) - c) * wscale;

      if (td.style.backgroundColor == colorB) {
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + wscale, y);
        ctx.stroke();
        ctx.closePath();

        ctxStr.beginPath();
        ctxStr.moveTo(x, y);
        ctxStr.lineTo(x + wscale, y);
        ctxStr.stroke();
        ctxStr.closePath();
      }
      else {
        ctxRev.beginPath();
        ctxRev.moveTo(x, y);
        ctxRev.lineTo(x + wscale, y);
        ctxRev.stroke();
        ctxRev.closePath();
      }
    }
  }
}

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

function removeEmpty(arrSts) {
  let arrReturn = new Array();
  for (s = 0; s < arrSts.length; s++) {
    if (arrSts[s].num > 0) {
      arrReturn.push(arrSts[s]);
    }
  }
  return arrReturn;
}

function concatSts(arrSts) {
  for (s = 0; s < arrSts.length; s++) {
    arrSts[s].txt = arrSts[s].num + arrSts[s].txt;
    arrSts[s].num = 1;
  }
  return arrSts;
}

function convertToSingle(arrSts) {
  for (s = 0; s < arrSts.length; s++) {
    if (arrSts[s].num > 1) {
      arrSts[s].txt = "(" + arrSts[s].txt + ") " + arrSts[s].num + " times";
      arrSts[s].num = 1;
    }
  }
  return arrSts;
}

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

function addXs() {
  for (r = pattern.gridRows; r > 1; r--) {
    let edgeColumns = getEdgeColumns(r);
    for (c = pattern.gridColumns; c >= 1; c--) {
      let td = getCell(r, c);
      let rBelow = parseInt(r, 10) - 1;
      let tdBelow = getCell(rBelow, c);
      let color = td.style.backgroundColor;
      let colorBelow = tdBelow.style.backgroundColor;
      td.innerHTML = plain;
      if (c == edgeColumns.first || c == edgeColumns.last) {
        if (r % 2 == 0) {
          td.style.backgroundColor = colorB;
        }
      }
      else {
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

function toggleCell(td) {
  let id = splitId(td.id);
  let r = id.row;
  let c = id.column;
  if (td.style.backgroundColor !== colorNoStitch && !isShaping()) {
    if (r > 1 && r < pattern.gridRows && c > 1 && c < pattern.gridColumns) {
      if (td.style.backgroundColor == colorB) {
        placePoint(r, c, colorA);
      }
      else {
        placePoint(r, c, colorB);
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

function selectCell(td) {
  if (selection.fromId == "") {
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

    let divSelectionMenu = document.getElementById("divSelectionMenu");
    divSelectionMenu.style.display = "";
    let selPaste = document.getElementById("selPaste");
    if (selection.cells.length > 0) {
      selPaste.style.display = "";
    }
    else {
      selPaste.style.display = "none";
    }
  }
}

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

function isShaping() {
  return document.getElementById("chkShaping").checked;
}

function chartMode() {
  return document.getElementById("selMode").value;
}

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

function restorePattern() {
  if (localStorage.getItem("pattern") !== null) {
    pattern = JSON.parse(localStorage.getItem("pattern"));
  }
  document.getElementById("selChartType").value = pattern.chartType;
  document.getElementById("txtGridColumns").value = pattern.gridColumns;
  document.getElementById("txtGridRows").value = pattern.gridRows;
}

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