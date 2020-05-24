'use babel'

/* ****Flake anatomy****
 *
 *      name
 * |------------|
 * button-primary-32b9e
 *                |---|
 *               hextail
 */

import assert from 'assert'
import matchall from 'string.prototype.matchall'

const FLAKE_AT_END_OF_STRING = new RegExp(/(^|[^A-Za-z0-9-])([a-z][a-z-]*?-([a-f0-9]{5}))$/)
export const ALL_FLAKES_IN_STRING = new RegExp(/(^|[^A-Za-z0-9-])([a-z][a-z-]*?-([a-f0-9]{5}))(?![A-Za-z0-9-])/g)
const START_OF_A_VALID_FLAKE = new RegExp(/^(.*?[^_A-Za-z-0-9])?([a-z][a-z-0-9]*?)$/)

export const isValidHextail = (hextail) => {
  // Hextail must include [a-f] and \d
  return typeof hextail === 'string' &&
         hextail.match(/^[a-f0-9]{5}$/) &&
         hextail.match(/[a-f]/) &&
         hextail.match(/\d/)
}

export const isValidFlake = (str) => {
  const match = str.match(FLAKE_AT_END_OF_STRING)

  return matchIsValidFlake(match)
}

// incoming matches are already validated as "shaped like" a flake
// the only test needed is letter/number hextail rule
const matchIsValidFlake = (match) => {
  return match && isValidHextail(match[3])
}

export const generateHextail = () => {
  let hextail = ''

  while (!isValidHextail(hextail)) {
    // any hex number from 0xA to 0xFFFF9
    hextail = Math.round(Math.random() * (0xFFFFA - 0xA) + 0xA)
      .toString(16)
      .padStart(5, '0')
  }

  return hextail
}

export const getFlakeBeginningMatch = (editor, bufferPosition) => {
  // non-flake char followed by a valid flake prefix
  const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition])
  const flakePrefixMatch = line.match(START_OF_A_VALID_FLAKE)

  return flakePrefixMatch
    ? flakePrefixMatch[2]
    : ''
}

export const getFlakeAtStringEnd = (line) => {
  const flakeMatch = line.match(FLAKE_AT_END_OF_STRING)

  return (matchIsValidFlake(flakeMatch)) ? flakeMatch[2] : undefined
}

export const getAllFlakes = (str) => {
  const allMatches = matchall(str, ALL_FLAKES_IN_STRING)

  let currMatch = allMatches.next()
  const flakes = []
  while (currMatch.done === false) {
    if (matchIsValidFlake(currMatch.value)) {
      flakes.push(currMatch.value[2])
    }
    currMatch = allMatches.next()
  }
  return flakes
}

assert(getFlakeAtStringEnd('foo-46ef5') === 'foo-46ef5')
assert(getFlakeAtStringEnd(' bar-2e5a4') === 'bar-2e5a4') // space leading
assert(getFlakeAtStringEnd('[baz-e0b84') === 'baz-e0b84') // non-space leading
assert(getFlakeAtStringEnd('invalid-hex-aaaaa') === undefined) // hextail missing number rule
assert(getFlakeAtStringEnd('invalid-hex-11111') === undefined) // hextail missing letter rule
assert.deepStrictEqual(getAllFlakes('a-217ba '), ['a-217ba'])
assert.deepStrictEqual(getAllFlakes('flake-7df0c,foo-ef1c5,aa-f2df0-bar-b5e2f[button-554c8].nav-998bf,invalid-f54eee\nnewline-f56c0\nsection-ccc85,invalid-hex-1111,invalid-hex-aaaa'),
  ['flake-7df0c', 'foo-ef1c5', 'button-554c8', 'nav-998bf', 'newline-f56c0', 'section-ccc85'])
