'use babel'

import fs from 'fs'
import findUp from 'find-up'
import { CONFIG_FILE_NAME } from './constants.js'

export const isValidFlakeHash = (hash) => {
  //hash must include [a-f] and \d
  return hash.match(/[a-f]/) &&
         hash.match(/\d/)
}

export const generateFlakeHash = () => {
  let hash = ""

  while(!isValidFlakeHash(hash)) {
    //any hex number from 0xA to 0xFFFF9
    hash = Math.round(Math.random() * (0xFFFFA - 0xA) + 0xA)
               .toString(16)
               .padStart(5,'0')
  }

  return hash
}

export const getPrefix = (editor) => {
  const bufferPosition = editor.getCursorBufferPosition()
  let lineToCursor = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition])
  let match = lineToCursor.match(/[a-z-]+$/)
  return match ?
         match[0] :
         ''
}

export const getFlakePrefixMatch = (editor, bufferPosition) => {
	//non-flake char followed by a valid flake prefix
	const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition])
	const flakePrefixMatch = line.match(/^(.*[^_A-Za-z-])?([a-z][a-z-]*)$/)

	return flakePrefixMatch ?
       	 flakePrefixMatch[2] :
				 ''
}

export const getActiveTextEditor = () => {
  const pane = atom.workspace.getActivePane()
  const activeItem = pane.getActiveItem()
  const isTextEditor = atom.workspace.isTextEditor(activeItem)
  if(isTextEditor) {
    return activeItem
  } else {
    return undefined
  }
}

export const getSnowflakeParent = (filePath) => {
  return findUp(CONFIG_FILE_NAME,{type:'file',cwd:filePath,allowSymlinks:false})
}
