'use babel'

import { exec } from "child_process"
import { isValidFlakeHash } from "./util.js"

class SnowflakeProvider {
	constructor () {
		// offer suggestions only when editing any file
		this.selector = '*'

		// make these suggestions appear above default suggestions
		this.suggestionPriority = 2

		this.suggestionsCollection = {}

		this.snowflakeCallback = this.snowflakeCallback.bind(this)
		this.pollSnowflakes = this.pollSnowflakes.bind(this)
		this.bigBrotherWatch = this.bigBrotherWatch.bind(this)
		this.addSuggestion = this.addSuggestion.bind(this)

		//check for flakes every 5 seconds
		this.poller = setInterval(this.pollSnowflakes,5000)

	}

	getSuggestions (options) {
		const { editor, bufferPosition } = options
		const prefix = this.getPrefix(editor, bufferPosition)

		if (prefix.length > 2) {
			return this.findMatchingSuggestions(prefix)
		}
	}

	bigBrotherWatch (bufferChange,a,b,c) {
		//early return if the last text inserted contained a non-flake char
		if (bufferChange.text.match(/[^a-z_0-9-]$/)) return

		const editPosition = bufferChange.range.end
		const editor = atom.workspace.getActiveTextEditor()
		const line = editor.getTextInRange([[editPosition.row, 0], editPosition])
		const charAfter = editor.getTextInRange([editPosition,[editPosition.row, editPosition.column+1]])

		//bigBrother doesn't record if there are valid snowflake characters following the cursor
		const snowflakeMatch = line.match(/[^_A-Za-z-]([a-z][a-z-]*-([a-f0-9]{5}))$/) ||
								           line.match(/^([a-z][a-z-]*-([a-f0-9]{5}))$/)



		//early return if the char after the cursor is a valid idenitfier char
		if(charAfter.match(/[A-Za-z_0-9-]/) ||
			 //early return if the prefix isn't a flake
			 snowflakeMatch === null)
			 return

		if (isValidFlakeHash(snowflakeMatch[2])) {
			const myProjPath = this.getProjectPath()

			const didAddSuggestion = this.addSuggestion(myProjPath,{newBigBro:snowflakeMatch[1]},false)
			if(didAddSuggestion)
				atom.notifications.addInfo(`New flake: <span style="color:black">${snowflakeMatch[1]}</span>`)
		}


	}

	getPrefix (editor, bufferPosition) {
		//non-snowflake char followed by a valid snowflake prefix
		const line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition])
		const snowflakeMatch = line.match(/[^_A-Za-z-]([A-Za-z][A-Za-z-]*)$/) ||
								           line.match(/^([A-Za-z][A-Za-z-]*)$/)

		return snowflakeMatch ?
	       	 snowflakeMatch[1] :
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
			description: "snowflake identifier"
		};
	}

	pollSnowflakes () {
		atom.project.getPaths().forEach((projPath, i) => {
			const runSnowflake = `npx --no-install snowflake-css report`

			exec(`${runSnowflake}`,{cwd: projPath}, this.snowflakeCallback.bind(this,projPath))
		})
	}

	snowflakeCallback (projPath,err,stdout,stderr) {

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

	addSuggestion (projPath,{polled = [],newBigBro},createProjectObj = true) {

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
export default new SnowflakeProvider();
