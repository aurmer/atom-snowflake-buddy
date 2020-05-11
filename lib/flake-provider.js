'use babel'

import { exec } from "child_process"
import { isValidFlakeHash,getFlakePrefixMatch,getSnowflakeParent,customLog } from "./util.js"
import { PACKAGE_NAME,CONFIG_FILE_NAME,BIG_BROTHER_QUEUE_SIZE,NOTIFICATION_MESSAGE_PREFIX,SnowflakeProject,SeenFile,MiB } from "./constants.js"

/*
 *
 * Flake anatomy


 *     prefix
 * |-------------|
 * button-primary-32b9e
 *                |---|
 *                 hash
 *
 */

class FlakeProvider {
	constructor () {
		// offer suggestions only when editing any file
		this.selector = '*'

		// make these suggestions appear above default suggestions
		this.suggestionPriority = 2

		this.bigBrotherIsActive = false
		this.activeProjectPath = ""
		this.projects = {}
		this.seenFiles = {}
	}

	getSuggestions (options) {
		if(this.activeProjectPath !== "") {
			const { editor, bufferPosition } = options
			const prefix = getFlakePrefixMatch(editor, bufferPosition)

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

	bigBrotherWatch = (bufferChange) => {
		if(this.bigBrotherIsActive) {
			//early return if the last text inserted contained a non-flake char
			if (bufferChange.text.match(/[^a-z_0-9-]$/)) return

			const editPosition = bufferChange.range.end
			const editor = atom.workspace.getActiveTextEditor()
			const line = editor.getTextInRange([[editPosition.row, 0], editPosition])
			const charAfter = editor.getTextInRange([editPosition,[editPosition.row, editPosition.column+1]])

			//match if flake is in the middle of the line or at the beginning
			const flakeMatch = line.match(/^(.*[^_A-Za-z0-9-])?([a-z][a-z-]*-([a-f0-9]{5}))$/)

				 //early return if the char after the cursor is a valid idenitfier char
			if(charAfter.match(/[A-Za-z_0-9-]/) ||
				 //early return if the prefix isn't a flake
				 flakeMatch === null)
				 return

			if (isValidFlakeHash(flakeMatch[3])) {
				const projPath = this.activeProjectPath

				const notifyEnabled = atom.config.get(PACKAGE_NAME).notifications.bigBrother
				this.projects[this.activeProjectPath].addBigBrotherFlake(flakeMatch[2])
				if (notifyEnabled)
					atom.notifications.addInfo(NOTIFICATION_MESSAGE_PREFIX,{	icon: "info",
																																		detail: `New flake: ${flakeMatch[2]}`})
			}
		}
	}

	newFileWatch = (textEditor) => {
		this.deactivate()
		if(textEditor) {
			const filePath = textEditor.getPath()
			if (this.seenFiles[filePath] && this.seenFiles[filePath].isCurrent()) {
				if (this.seenFiles[filePath].isSnowflakeProject) {
					this.activateAndAddProjectAndIndexFlakes(this.seenFiles[filePath].projectPath)
				}
			} else {
				getSnowflakeParent(filePath)
					.then(this.getProjectCallback.bind(this,filePath))
			}
		}
	}

	getProjectCallback = (filePath,snowflakeConfigPath) => {
		const projPath = (snowflakeConfigPath) ? snowflakeConfigPath.substring(0,snowflakeConfigPath.length-CONFIG_FILE_NAME.length) : ""
		this.seenFiles[filePath] = new SeenFile(projPath)
		if(projPath) {
			this.activateAndAddProjectAndIndexFlakes(projPath)
		} else {
			if(atom.config.get(PACKAGE_NAME).notifications.snowflakeError)
				atom.notifications.addError(NOTIFICATION_MESSAGE_PREFIX,{	icon: "file-directory",
																																	dismissable:true,
																																	detail: `'snowflake-css.json' wasn't found in the parent directories of the file: "${filePath}"`})
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
		// TODO: define this project object elsewhere
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
		const notifyEnabled = atom.config.get(PACKAGE_NAME).notifications.snowflakeError

		if(err || stderr) {
			//exec error
			errorDetail = "'npx snowflake-css report' run error"
			const errorStack = stderr
			const e2 = err
			const e3 = err

			console.log(stderr)
			console.log(errorStack)
			console.log(e2)
			console.log(e3)
			console.log(err)
		} else if (stdout) {
			let r
			try {
				r = JSON.parse(stdout)
				this.projects[this.activeProjectPath].setIndexedFlakes([...r.outputFlakes,
																															  ...r.lonelyInputFlakes,
																															  ...r.lonelyTemplateFlakes])
				if(notifyEnabled)
					atom.notifications.addInfo(`snowflake-css success`,{detail: this.activeProjectPath})
			} catch(jsonError) {
				//JSON.parse error
				errorDetail = `'npx snowflake-css report' return - JSON parse error`
				errorStack = jsonError + `\n \nExpected the following to be JSON:\n \n` + stdout
			}
		} else {
			//unknown (probably unreachable)
			errorDetail = "Unknown error occurred in 'npx snowflake-css report' exec callback"
		}

		if(notifyEnabled && (errorDetail !== "" || errorStack !== "")) {
			atom.notifications.addError(NOTIFICATION_MESSAGE_PREFIX,{ icon: "file-directory",
																																dismissable:true,
																																stack:errorStack,
																																detail:errorDetail})
		}
	}
}
export default new FlakeProvider()
