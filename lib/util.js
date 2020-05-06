'use babel'

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

export const getPrefix = (editor, bufferPosition) => {
  let lineToCursor = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition])
  let match = lineToCursor.match(/[a-z-]+$/)
  return match ?
         match[0] :
         ''
}
