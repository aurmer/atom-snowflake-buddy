'use babel'

import { CompositeDisposable } from 'atom'

import flakeProvider from './flake-provider'
import { getPrefix, generateFlakeHash,getActiveTextEditor } from "./util.js"
import { PACKAGE_CONFIGS,PACKAGE_NAME,NOTIFICATION_MESSAGE_PREFIX } from "./constants.js"


/*
TODO: snippet for making and decorating markers... to be used for styling flake hashes.
editor = atom.workspace.getActiveTextEditor()
range = editor.getSelectedBufferRange()
marker = editor.markBufferRange(range, {invalidate: 'never'})
editor.decorateMarker(marker, {type: 'text',class: "flake-hash-63c79"})

//global access to this. cool.
atom.packages.activePackages['snowflake-css-atom'].mainModule

*/

export default {
  config: PACKAGE_CONFIGS,

  activate(state) {

    this.addSubscriptionTextEditor = this.addSubscriptionTextEditor.bind(this)

    this.subscriptions = new CompositeDisposable()
    //print hash hook
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      [`${PACKAGE_NAME}:generate-hash`]: () => this.generateHash()
    }))
    //big brother hook
    this.subscriptions.add(atom.workspace.observeTextEditors(
      (activeEditor) => {
        //this fires on typing AND on hash gen but not autocomplete
        activeEditor.onDidInsertText(flakeProvider.bigBrotherWatch)
      }))
    //tab change hook
    this.subscriptions.add(atom.workspace.observeActiveTextEditor(flakeProvider.newFileWatch))
    this.subscriptions.add(atom.workspace.observeActiveTextEditor(this.addSubscriptionTextEditor))
  },

  addSubscriptionTextEditor (textEditor) {
    if(atom.workspace.isTextEditor(textEditor))
      //need to trigger a file read on rename just like switch tab
      this.subscriptions.add(textEditor.onDidChangePath(flakeProvider.newFileWatch.bind(null,textEditor)))
  },

  deactivate() {
    this.subscriptions.dispose()
  },

  getProvider() {
    return flakeProvider
  },

  generateHash() {
    const textEditor = getActiveTextEditor()
    if(textEditor) {
      const prefix = getPrefix(textEditor)

      const notifyEnabled = atom.config.get(PACKAGE_NAME).notifications.hashGen

      //get info on "did we just generate a hash on this file?"
      const textChanges = textEditor.buffer.getChangesSinceCheckpoint(this.hashGenCheckpoint)
      const recentHash = (textChanges.length === 1) && textChanges[0].newText.match(/^-?[a-f0-9]{5}$/)
      const cursorLoc = textEditor.getCursorBufferPosition()
      const isCursorLocationSame = (textChanges.length === 1) && (textChanges[0].newRange.end.row === cursorLoc.row) && (textChanges[0].newRange.end.column === cursorLoc.column)

      let newText = ""
      let detailMessage = ""
      //reroll condition
      if(recentHash !== null && isCursorLocationSame) {
        newText = generateFlakeHash()
        newText.split('').forEach(()=>textEditor.backspace())
        detailMessage = "Overwrote old flake hash."
      }
      // //no prefix condition
      // else if(prefix === "") {
      //   if(notifyEnabled) {
      //     atom.notifications.addWarning(`${NOTIFICATION_MESSAGE_PREFIX}Please type a valid flake prefix before generating a flake hash.`,{icon:'alert'})
      //   }
      //   //TODO: flashErrorCursor()
      // }
      //TODO: is this done? we happy with behavior? remove the babysitting?
      else if(prefix.endsWith('-')) {
        newText = generateFlakeHash()
        detailMessage = "Generated new flake hash."
      }
      else {
        newText = "-" + generateFlakeHash()
        detailMessage = "Generated new flake hash."
      }

      if (newText !== "") {
        this.hashGenCheckpoint = textEditor.buffer.createCheckpoint()
        textEditor.insertText(newText)

        if(notifyEnabled) {
          atom.notifications.addInfo(NOTIFICATION_MESSAGE_PREFIX,{icon:'info',
                                                                  detail: detailMessage})
        }
      }
    }
  }
}
