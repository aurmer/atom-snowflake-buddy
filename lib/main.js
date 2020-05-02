'use babel';

import { CompositeDisposable } from 'atom'

import snowflakeProvider from './snowflake-provider'

export default {
  activate(state) {

    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'snowflake:generate-hash': () => this.printRandomHash()
    }))
    this.subscriptions.add(atom.workspace.observeTextEditors(
      (activeEditor) => {
        //onDidChange might catch more, but might cause drag
        activeEditor.onDidInsertText(snowflakeProvider.bigBrotherWatch)
      }))
  },

  tester() {
    console.log('ewfew')
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

    while (!isValidHash(hash)) {
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

    function isValidHash (h) {
      //hash must have an alpha and a numeric
      return h.match(/[a-f]/) &&
             h.match(/\d/)
    }

    function genHash() {
      //any number from 0x1000A to 0xFFFF9
      return Math.round(Math.random() * (0xFFFFA - 0xA) + 0xA)
                 .toString(16)
                 .padStart(5,'0')
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
