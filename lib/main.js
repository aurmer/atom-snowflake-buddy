'use babel';

import { CompositeDisposable } from 'atom'

import snowflakeProvider from './snowflake-provider'


/*
TODO: snippet for making and decorating markers... to be used for styling flake hashes.
editor = atom.workspace.getActiveTextEditor()
range = editor.getSelectedBufferRange()
marker = editor.markBufferRange(range, {invalidate: 'never'})
editor.decorateMarker(marker, {type: 'text',class: "flake-hash-63c79"})

*/

export default {
  config: {
    pollingRate: {
      title: 'Snowflake-CSS CLI Tool Polling Rate',
      description: '\'snowflake-css report\' will run on your active project this frequently (in seconds).',
      type: 'integer',
      default: 60,
      minimum: 5,
    },
    flakeHashTransparency: {
      title: 'Flake Hash Transparency',
      description: 'Semi-transparency provides visual feedback for valid flakes. The hash on each flake will be dimmed by this amount (in percent).',
      type: 'integer',
      default: 50,
      minimum: 0,
      maximum: 99
    },
    nestedProjectDepth: {
      title: 'Max Path Depth',
      description: 'Projects using snowflake-css aren\'t necessarily at the root of the Project Folder. Snowflake-css-atom will search for projects with \'snowflake-css.json\' as far as X folders deep.',
      type: 'integer',
      default: 5,
      minimum: 0,
      maximum: 20
    },
    notifications: {
      type: 'object',
      properties: {
        enableBigBrotherNotifications: {
          title: 'Enable Flake Detection Notifications',
          description: 'When enabled, typing an new flake will produce a notification.',
          type: 'boolean',
          default: true
        },
        enableHashGeneratorNotifications: {
          title: 'Enable Hash Generation Notifications',
          description: 'When enabled, running flake hash generation will produce a notification.',
          type: 'boolean',
          default: true
        }
      }
    }
  },

  activate(state) {

        // atom.config.unset('snowflake-css-atom.pollingRate')
        //     atom.config.unset('snowflake-css-atom.anInt')

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
