'use babel';

import { CompositeDisposable } from 'atom'

import snowflakeProvider from './snowflake-provider'

export default {
    activate(state) {

      this.subscriptions = new CompositeDisposable()
      this.subscriptions.add(atom.commands.add('atom-workspace', {
        'snowflake:generate-hash': () => this.printRandomHash()
      }))

    },

  deactivate() {
    this.modalPanel.destroy()
    this.subscriptions.dispose()
    this.snowflakePackageView.destroy()
  },

  serialize() {
    return {
      // TODO: is this important?
    }
  },

  printRandomHash() {
    let hash = genHash()

    while (!isValid(hash)) {
      hash = genHash()
    }

    let editor = atom.workspace.getActiveTextEditor()

    const prefix = getPrefix(editor,atom.workspace.getActiveTextEditor().getCursorBufferPosition())

    if(prefix.match(/-$/)) {
      editor.insertText(hash)
    } else if(prefix === "") {
      atom.notifications.addWarning('Please type a valid snowflake selector before generating a snowflake hash.')
    } else {
      editor.insertText(`-${hash}`)
    }

    function isValid (h) {
      //hash must have an alpha and a numeric
      return h.match(/[A-F]/) &&
             h.match(/\d/)
    }

    function genHash() {
      //any number from 0x1000A to 0xFFFF9
      return Math.round(Math.random() * (0xFFFFA - 0x1000A) + 0x1000A)
                 .toString(16)
                 .toUpperCase()
    }

    function getPrefix(editor, bufferPosition) {
      let lineToCursor = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition])
      let match = lineToCursor.match(/[a-z-]+$/)
      return match ?
             match[0] :
             ''
    }
  },

  getProvider() {
    return snowflakeProvider
  }
};
