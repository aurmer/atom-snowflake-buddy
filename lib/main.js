'use babel'

import { CompositeDisposable } from 'atom'

import snowflakeProvider from './snowflake-provider'
import { getPrefix, generateFlakeHash } from "./util.js"
import { PACKAGE_CONFIGS,PACKAGE_NAME } from "./constants.js"


/*
TODO: snippet for making and decorating markers... to be used for styling flake hashes.
editor = atom.workspace.getActiveTextEditor()
range = editor.getSelectedBufferRange()
marker = editor.markBufferRange(range, {invalidate: 'never'})
editor.decorateMarker(marker, {type: 'text',class: "flake-hash-63c79"})

*/

export default {
  config: PACKAGE_CONFIGS,

  activate(state) {
    this.subscriptions = new CompositeDisposable()
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'snowflake:generate-hash': () => this.printRandomHash()
    }))
    this.subscriptions.add(atom.workspace.observeTextEditors(
      (activeEditor) => {
        //this fires on typing AND on hash gen
        activeEditor.onDidInsertText(snowflakeProvider.bigBrotherWatch)
      }))
  },

  deactivate() {
    this.modalPanel.destroy()
    this.subscriptions.dispose()
    this.snowflakePackageView.destroy()
  },

  getProvider() {
    return snowflakeProvider
  },

  printRandomHash() {
    const editor = atom.workspace.getActiveTextEditor()
    const prefix = getPrefix(editor,atom.workspace.getActiveTextEditor().getCursorBufferPosition())

    const notifyEnabled = atom.config.get(`${PACKAGE_NAME}.notifications.enableHashGeneratorNotifications`)
    if(prefix === "") {
      if(notifyEnabled) {
        atom.notifications.addWarning('Please type a valid flake prefix before generating a flake hash.')
      }
      //TODO: flashErrorCursor()
    }
    else if(prefix.endsWith('-')) {
      editor.insertText(generateFlakeHash())
    }
    else {
      editor.insertText(`-${generateFlakeHash()}`)
    }
  }
};
