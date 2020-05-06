'use babel'

import { exec } from "child_process"
import { isValidFlakeHash } from "./util.js"
import { PACKAGE_NAME } from "./constants.js"

class FlakeProvider {
	constructor () {
		// offer suggestions only when editing any file
		this.selector = '*'

		// make these suggestions appear above default suggestions
		this.suggestionPriority = 2

		//custom prop which keeps track of flakes in each workspace
		this.suggestionsCollection = {}
		this.config = {}
		//check for flakes every 5 seconds
		this.poller = setInterval(this.pollFlakes,5000)

	}

	setConfig = (config) => {
		this.config = config
	}

	getSuggestions (options) {
		const { editor, bufferPosition } = options
		const prefix = this.getPrefix(editor, bufferPosition)

		//don't start suggesting until 3 char typed
		if (prefix.length > 2) {
			return this.findMatchingSuggestions(prefix)
		}
	}

	getPrefix (editor, bufferPosition) {
		//non-flake char followed by a valid flake prefix
		const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition])
		const flakeMatch = line.match(/[^_A-Za-z-]([A-Za-z][A-Za-z-]*)$/) ||
								           line.match(/^([A-Za-z][A-Za-z-]*)$/)

		return flakeMatch ?
	       	 flakeMatch[1] :
					 ''
	}

	getProjectPath () {
		let myProjPath
		//it is possible to not have an active text editor
		const filePath = atom.workspace.getActiveTextEditor() &&
										 atom.workspace.getActiveTextEditor().getPath()

		atom.project.getPaths().forEach((projPath, i) => {
			if (filePath && filePath.includes(projPath)) {
				myProjPath = projPath
			}
		})

		return myProjPath
	}

	findMatchingSuggestions (prefix) {

		const myProjPath = this.getProjectPath()

		const prefixLower = prefix.toLowerCase()
		const myProj = this.suggestionsCollection[myProjPath]

		const mySuggestions = (myProj) ? [...new Set([...myProj.suggestions.polled,
			                                            ...myProj.suggestions.bigBro])] : []

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
		};
	}

	bigBrotherWatch = (bufferChange) => {

		//early return if the last text inserted contained a non-flake char
		if (bufferChange.text.match(/[^a-z_0-9-]$/)) return

		const editPosition = bufferChange.range.end
		const editor = atom.workspace.getActiveTextEditor()
		const line = editor.getTextInRange([[editPosition.row, 0], editPosition])
		const charAfter = editor.getTextInRange([editPosition,[editPosition.row, editPosition.column+1]])

		//match if flake is in the middle of the line or at the beginning
		const flakeMatch = line.match(/^(.*[^_A-Za-z-])?([a-z][a-z-]*-([a-f0-9]{5}))$/) ||
								           line.match(/^([a-z][a-z-]*-([a-f0-9]{5}))$/)




		//early return if the char after the cursor is a valid idenitfier char
		if(charAfter.match(/[A-Za-z_0-9-]/) ||
			 //early return if the prefix isn't a flake
			 flakeMatch === null)
			 return

		if (isValidFlakeHash(flakeMatch[3])) {
			const myProjPath = this.getProjectPath()

			const notifyEnabled = atom.config.get(PACKAGE_NAME).notifications.bigBrother
			const didAddSuggestion = this.addSuggestion(myProjPath,{newBigBro:flakeMatch[2]},false)
			if(didAddSuggestion && notifyEnabled)
				atom.notifications.addInfo(`New flake: <span style="color:black">${flakeMatch[2]}</span>`)
		}


	}

	pollFlakes = () => {
		atom.project.getPaths().forEach((projPath, i) => {
			const runFlake = `npx --no-install snowflake-css report`

			exec(`${runFlake}`,{cwd: projPath}, this.runFlakeCallback.bind(this,projPath))
		})
	}

	runFlakeCallback = (projPath,err,stdout,stderr) => {

		//early return if there was a problem with snowflake execution
		//TODO: do something smart here to conditionally inform the user
		if(stderr) return


		let r

		if(stdout) {
			try {
				r = JSON.parse(stdout)
			} catch(err) {
				//die silently
			}
		}

		if(r)
			this.addSuggestion(projPath,{polled:[...r.outputFlakes,
																					 ...r.lonelyInputFlakes,
																					 ...r.lonelyTemplateFlakes]})
	}

	addSuggestion = (projPath,{polled = [],newBigBro},createProjectObj = true) => {

		if(this.suggestionsCollection[projPath]) {
			if(polled) {
				this.suggestionsCollection[projPath].suggestions.polled = polled
			}
			if(newBigBro) {
				const bigBro = this.suggestionsCollection[projPath].suggestions.bigBro
				this.suggestionsCollection[projPath].suggestions.bigBro = [bigBro[1],bigBro[2],newBigBro]
			}
			return true
		} else if(createProjectObj) {
			this.suggestionsCollection[projPath] = {
				projPath: projPath,
				suggestions: {
					polled: polled,
					bigBro: [undefined,undefined,newBigBro]
				}
			}
			return true
		}
		return false
	}
}
export default new FlakeProvider();
