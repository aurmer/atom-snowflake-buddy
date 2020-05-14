'use babel'

import { CompositeDisposable } from 'atom'

import flakeProvider from './flake-provider'
import { didJustGenerateHextail,getCharBeforeCursor,getActiveTextEditor } from "./util.js"
import { PACKAGE_CONFIGS,PACKAGE_NAME } from "./constants.js"
import { notifyHextailGen } from "./notify.js"
import { generateHextail } from "./flake-validation.js"

/*
//global access to this. cool.
atom.packages.activePackages['snowflake-css-atom'].mainModule

*/

export default {
  config: PACKAGE_CONFIGS,

  activate(state) {
    this.addSubscriptionTextEditor = this.addSubscriptionTextEditor.bind(this)

    this.subscriptions = new CompositeDisposable()
    //print hextail hook
    this.subscriptions.add(atom.commands.add('atom-text-editor', {
      [`${PACKAGE_NAME}:generate-hextail`]: () => this.handleGenerateHextail(),
      [`${PACKAGE_NAME}:log-markers`]: () => flakeProvider.logMarkers(), //TODO: remove
      [`${PACKAGE_NAME}:zzTest`]: () => flakeProvider.zzTest() //TODO: remove
    }))

    //TODO: on save, skim buffer for flakes and clear markers//re-mark
    //tab change hook
    this.subscriptions.add(atom.workspace.observeActiveTextEditor(flakeProvider.newFileWatch))
    this.subscriptions.add(atom.workspace.observeActiveTextEditor(flakeProvider.decorateFileWatch))
    this.subscriptions.add(atom.workspace.observeActiveTextEditor(this.addSubscriptionTextEditor))
  },

  addSubscriptionTextEditor (textEditor) {
    if (atom.workspace.isTextEditor(textEditor)) {
      if(!textEditor.snowflakeIsHooked) {
        textEditor.snowflakeIsHooked = true
        //TODO: buffer.onDidConflict() might be a good time to override the sf_timeout

        //need to trigger a file read on rename just like switch tab
        this.subscriptions.add(textEditor.onDidChangePath(flakeProvider.newFileWatch.bind(null,textEditor)))
        //don't play nice with multi-cursor
        this.subscriptions.add(textEditor.onDidAddCursor(flakeProvider.cursorWatch.bind(null,textEditor)))
        this.subscriptions.add(textEditor.onDidRemoveCursor(flakeProvider.cursorWatch.bind(null,textEditor)))
        //flake decoration on typing
        this.subscriptions.add(textEditor.getBuffer().onDidChange(flakeProvider.decorateChangesWatch.bind(null,textEditor)))
        //flake detection on typing
        this.subscriptions.add(textEditor.onDidInsertText(flakeProvider.bigBrotherWatch.bind(null,textEditor)))
      }
    }
  },

  deactivate() {
    this.subscriptions.dispose()
  },

  getProvider() {
    return flakeProvider
  },

	//TODO: new module Z
  handleGenerateHextail() {
    const textEditor = getActiveTextEditor()
    //early return if a text editor isn't active or if there is more than one cursor
    if (!textEditor || textEditor.getCursors().length > 1) return

    const isRerolling = didJustGenerateHextail(textEditor,this.hextailGenCheckpoint)

    let newText = ""
    let detailMessage = ""
    //reroll condition
    if (isRerolling) {
      newText = generateHextail()
      newText.split('').forEach(()=>textEditor.backspace()) //delete chars to be replaced
      detailMessage = "Overwrote old hextail."
    }
    else {
      if (getCharBeforeCursor(textEditor) !== '-') {
        textEditor.insertText('-')
      }
      newText = generateHextail()
      detailMessage = "Generated new hextail."
    }

    if (newText !== "") {
      this.hextailGenCheckpoint = textEditor.buffer.createCheckpoint()
      textEditor.insertText(newText)
      notifyHextailGen(detailMessage)
    }
  }
}
