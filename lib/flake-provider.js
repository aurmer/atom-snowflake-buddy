'use babel'

import { exec } from "child_process"
import { isValidFlakeHash,handleMarkerChange,getFlakePrefixMatch,getSnowflakeParent,customLog,includePossibleBoundaryFlakes } from "./util.js"  //TODO: flake-validation module functions
import { PACKAGE_NAME,CONFIG_FILE_NAME,BIG_BROTHER_QUEUE_SIZE,MiB } from "./constants.js"
import { SnowflakeProject,ViewedFile } from "./classes.js"
import { isValidHextail,isValidFlake,getFlakeAtStringEnd,ALL_FLAKES_IN_STRING } from "./flake-validation.js"
import { notifyNewFlakeDetected,notifySnowflakeNotFound,notifySnowflakeError,notifySnowflakeSuccess } from "./notify.js"



class FlakeProvider {
	constructor () {
		// offer suggestions only when editing any file
		this.selector = '*'

		// make these suggestions appear above default suggestions
		this.suggestionPriority = 2

		this.bigBrotherIsActive = false
		this.activeProjectPath = ""
		this.projects = {}
		this.viewedFiles = {}
	}

	getSuggestions (options) {
		if(this.activeProjectPath !== "") {
			const { editor, bufferPosition } = options
			const prefix = getFlakePrefixMatch(editor, bufferPosition) //TODO: flake-validation module functions

			//don't start suggesting until 3 char typed
			if (prefix.length > 2) {
				return this.findMatchingSuggestions(prefix)
			}
		}
	}

	findMatchingSuggestions (prefix) {
		const prefixLower = prefix.toLowerCase()
		const mySuggestions = this.projects[this.activeProjectPath] && this.projects[this.activeProjectPath].flakes

		//TODO what if flakes isn't an array?
		const matchingSuggestions = mySuggestions.filter((suggestion) => {
			if(!suggestion) return false
			const textLower = suggestion.toLowerCase()
			return textLower.startsWith(prefixLower)
		})

		// run each matching suggestion through inflateSuggestion() and return
		return matchingSuggestions.map(this.inflateSuggestion.bind(null,prefix))
	}

	inflateSuggestion (replacementPrefix, suggestion) {
		return {
			text: suggestion,
			type: 'class',
			replacementPrefix: replacementPrefix,
			description: "flake identifier"
		}
	}

	deactivate = () => {
		this.bigBrotherIsActive = false
		this.activeProjectPath = ""
	}

	activate = (projPath) => {
		this.bigBrotherIsActive = true
		this.activeProjectPath = projPath
	}

	cursorWatch = (textEditor) => {
		const cursorCount = textEditor.getCursors().length
		if(cursorCount > 1) {
			this.deactivate()
		}
		else {
			this.newFileWatch(textEditor)
		}
	}

	//TODO: new module Z
	decorateFileWatch = (textEditor) => {
		if(!textEditor) return
		const textBuffer = textEditor.getBuffer()
		let mkLay

		//create our markerlayer and decorate only once
		if(textEditor.snowflakeMarkerLayerId) {

			mkLay = textEditor.getMarkerLayer(textEditor.snowflakeMarkerLayerId)
			mkLay.clear()
		} else {
			mkLay = textEditor.addMarkerLayer({maintainHistory:true})
			textEditor.snowflakeMarkerLayerId = mkLay.id
			textEditor.decorateMarkerLayer(mkLay, {type: 'text',class: "flake-hextail-63c79"})
		}

		textBuffer.scanInRange(ALL_FLAKES_IN_STRING,textBuffer.getRange(),({match,range}) => {
			if(isValidHextail(match[3])) {
				const myRange = [[range.end.row,range.end.column-5],[range.end.row,range.end.column]]
				const marker = mkLay.markBufferRange(myRange,{maintainHistory: true,
																								invalidate: 'touch'})
				marker.onDidChange(handleMarkerChange.bind(null,marker,textBuffer))
			}
		})
	}

	zzTest = () => {
		const te = atom.workspace.getActiveTextEditor()
		const range = te.getSelections()[0].getBufferRange()
		const buffer = te.getBuffer()

		buffer.scanInRange(ALL_FLAKES_IN_STRING,range,(m) => console.dir(m))

	}

	//TODO: new module Z
	decorateChangesWatch = (textEditor,event) => {
		if(!textEditor) return
		event.changes.forEach((change, idx) => {
			const textBuffer = textEditor.getBuffer()
			const mkLay = textEditor.getMarkerLayer(textEditor.snowflakeMarkerLayerId)
			const scanRange = includePossibleBoundaryFlakes(change.newRange,textBuffer)
			textBuffer.scanInRange(ALL_FLAKES_IN_STRING,scanRange,({match,range}) => {
				if(isValidHextail(match[3])) {
					const myRange = [[range.end.row,range.end.column-5],[range.end.row,range.end.column]]
					const marker = mkLay.markBufferRange(myRange,{maintainHistory: true,
																									invalidate: 'touch'})
					marker.onDidChange(handleMarkerChange.bind(null,marker,textBuffer))
				}
			})
		})
	}

	//TODO: remove
	logMarkers = () => {
		const textEditor = atom.workspace.getActiveTextEditor()
    const markers = textEditor.getMarkerLayer(textEditor.snowflakeMarkerLayerId).getMarkers()
		console.log(markers)
		markers.forEach( (mk,idx) => {
			// console.log(`~~~~~~~${idx}~~~~~~~`)
			// console.log(mk.toString())
			console.log(`|${atom.workspace.getActiveTextEditor().getBuffer().getTextInRange(mk.getBufferRange())}|${mk.id}|`)
		})
  }

	bigBrotherWatch = (textEditor,bufferChange) => {
		if(this.bigBrotherIsActive) {
			//early return if the last text inserted contained a non-flake char
			const ONE_NONFLAKE_CHAR = new RegExp(/[^a-z0-9-]$/)
			if (bufferChange.text.match(ONE_NONFLAKE_CHAR)) return

			const cursorPos = bufferChange.range.end
			const line = textEditor.getTextInRange([[cursorPos.row, 0], cursorPos])
			const flake = getFlakeAtStringEnd(line)

			//early return if the prefix isn't a flake
			if(flake === undefined) return

			this.projects[this.activeProjectPath].addBigBrotherFlake(flake)
			notifyNewFlakeDetected(flake)
		}
	}

	newFileWatch = (textEditor) => {
		this.deactivate()
		if(textEditor) {
			const filePath = textEditor.getPath()
			if (this.viewedFiles[filePath] && this.viewedFiles[filePath].isCurrent()) {
				if (this.viewedFiles[filePath].isSnowflakeProject) {
					this.activateAndAddProjectAndIndexFlakes(this.viewedFiles[filePath].projectPath)
				}
			} else {
				getSnowflakeParent(filePath)
					.then(this.getProjectCallback.bind(this,filePath))
			}
		}
	}

	getProjectCallback = (filePath,snowflakeConfigPath) => {
		const projPath = (snowflakeConfigPath) ? snowflakeConfigPath.substring(0,snowflakeConfigPath.length-CONFIG_FILE_NAME.length) : ""
		this.viewedFiles[filePath] = new ViewedFile(projPath)
		if(projPath) {
			this.activateAndAddProjectAndIndexFlakes(projPath)
		} else {
			notifySnowflakeNotFound(filePath)
		}
	}

	activateAndAddProjectAndIndexFlakes = (projPath) => {
		this.activate(projPath)
		if(!this.projects[this.activeProjectPath]) {
			this.addProject(this.activeProjectPath)
		}
		this.indexFlakes()
	}

	addProject = (projPath) => {
		this.projects[projPath] = new SnowflakeProject(projPath)
	}

	indexFlakes = () => {
		//not too often
		if(!this.projects[this.activeProjectPath].isCurrent()) {
			const snowflakeCommand = `npx --no-install snowflake-css report`
			exec(snowflakeCommand,{maxBuffer: 10 * MiB,cwd: this.activeProjectPath}, this.indexFlakesCallback)
		}
	}

	indexFlakesCallback = (err,stdout,stderr) => {
		let errorDetail = ""
		let errorStack = ""

		if(err || stderr) {
			//exec error
			errorDetail = "'npx snowflake-css report' run error"
			errorStack = err || stderr
		} else if (stdout) {
			let r
			try {
				r = JSON.parse(stdout)
				this.projects[this.activeProjectPath].setIndexedFlakes([...r.outputFlakes,
																															  ...r.lonelyInputFlakes,
																															  ...r.lonelyTemplateFlakes])
				notifySnowflakeSuccess(this.activeProjectPath)
			} catch(jsonError) {
				//JSON.parse error
				errorDetail = `'npx snowflake-css report' return - JSON parse error`
				errorStack = jsonError + `\n \nExpected the following to be JSON:\n \n` + stdout
			}
		} else {
			//unknown (probably unreachable)
			errorDetail = "Unknown error occurred in 'npx snowflake-css report' exec callback"
		}

		notifySnowflakeError(errorDetail,errorStack)
	}
}
export default new FlakeProvider()
