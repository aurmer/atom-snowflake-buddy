'use babel'

import findUp from 'find-up'
import { CONFIG_FILE_NAME } from './constants.js'
import { isValidHextail } from './flake-validation.js'

export const getCharBeforeCursor = (editor) => {
  const bufferPosition = editor.getCursorBufferPosition()
  const charBeforeCursor = editor.getTextInRange([[bufferPosition.row, bufferPosition.column - 1],
    bufferPosition])
  return charBeforeCursor
}

export const didJustGenerateHextail = (textEditor, checkpoint) => {
  const textChanges = textEditor.buffer.getChangesSinceCheckpoint(checkpoint)
  const cursorLoc = textEditor.getCursorBufferPosition()
  const isCursorLocationSame = (textChanges.length === 1) &&
                               (textChanges[0].newRange.end.row === cursorLoc.row) &&
                               (textChanges[0].newRange.end.column === cursorLoc.column)
  const lastHash = (textChanges.length === 1) && textChanges[0].newText

  return isValidHextail(lastHash) && isCursorLocationSame
}

export const getActiveTextEditor = () => {
  const pane = atom.workspace.getActivePane()
  const activeItem = pane.getActiveItem()
  const isTextEditor = atom.workspace.isTextEditor(activeItem)
  if (isTextEditor) {
    return activeItem
  } else {
    return undefined
  }
}

export const getSnowflakeParent = (filePath) => {
  return findUp(CONFIG_FILE_NAME, { type: 'file', cwd: filePath, allowSymlinks: false })
}
