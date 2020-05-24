"use babel";

import { PACKAGE_NAME } from "./constants.js";
import {
  isValidHextail,
  isValidFlake,
  ALL_FLAKES_IN_STRING,
} from "./flake-validation.js";

const handleMarkerChange = (marker, textBuffer, evt) => {
  if (evt.isValid === false) marker.destroy();

  const tailRange = marker.getBufferRange();
  const flakeRange = includePossibleBoundaryFlakes(tailRange, textBuffer);
  const flakeText = textBuffer.getTextInRange(flakeRange);

  if (!isValidFlake(flakeText)) marker.destroy();
};

const includePossibleBoundaryFlakes = (editRange, textBuffer) => {
  const rangeCopy = editRange.copy();
  while (includePrevFlakeChar(rangeCopy, textBuffer)) {}
  while (includeNextFlakeChar(rangeCopy, textBuffer)) {}

  return rangeCopy.translate([0, -1], [0, 0]);
};

const includePrevFlakeChar = (editRange, textBuffer) => {
  if (editRange.start.column === 0) return false;
  const newRange = editRange.translate([0, -1], [0, 0]);
  if (textBuffer.getTextInRange(newRange).match(/^[a-z0-9A-Z-]/)) {
    editRange.start = newRange.start;
    return true;
  }
  return false;
};

const includeNextFlakeChar = (editRange, textBuffer) => {
  const newRange = editRange.translate([0, 0], [0, 1]);
  const oldRangeText = textBuffer.getTextInRange(editRange);
  const newRangeText = textBuffer.getTextInRange(newRange);

  if (
    oldRangeText.length !== newRangeText.length &&
    newRangeText.match(/[a-z0-9A-Z-]$/)
  ) {
    editRange.end = newRange.end;
    return true;
  }
  return false;
};

const markValidMatches = (mkLay, textBuffer, { match, range }) => {
  if (isValidHextail(match[3])) {
    const myRange = [
      [range.end.row, range.end.column - 5],
      [range.end.row, range.end.column],
    ];
    const marker = mkLay.markBufferRange(myRange, { invalidate: "touch" });
    marker.onDidChange(handleMarkerChange.bind(null, marker, textBuffer));
  }
};

export default {
  watchFile: (textEditor) => {
    if (!textEditor) return;
    const textBuffer = textEditor.getBuffer();
    let mkLay;

    // create our markerlayer and decorate only once
    if (textEditor.snowflakeMarkerLayerId) {
      mkLay = textEditor.getMarkerLayer(textEditor.snowflakeMarkerLayerId);
      mkLay.clear(); // if the marker layer was already there, clear it and rescan
    } else {
      mkLay = textEditor.addMarkerLayer({ maintainHistory: true });
      textEditor.snowflakeMarkerLayerId = mkLay.id;
    }

    const hextailOpacity =
      (100 - atom.config.get(PACKAGE_NAME).hextailTransparency) / 100;
    textEditor.decorateMarkerLayer(mkLay, {
      type: "text",
      style: { opacity: hextailOpacity },
    });
    textBuffer.scanInRange(
      ALL_FLAKES_IN_STRING,
      textBuffer.getRange(),
      markValidMatches.bind(null, mkLay, textBuffer)
    );
  },

  watchChanges: (textEditor, event) => {
    if (!textEditor) return;
    event.changes.forEach((change, idx) => {
      const textBuffer = textEditor.getBuffer();
      const mkLay = textEditor.getMarkerLayer(
        textEditor.snowflakeMarkerLayerId
      );
      const scanRange = includePossibleBoundaryFlakes(
        change.newRange,
        textBuffer
      );
      textBuffer.scanInRange(
        ALL_FLAKES_IN_STRING,
        scanRange,
        markValidMatches.bind(null, mkLay, textBuffer)
      );
    });
  },
};
