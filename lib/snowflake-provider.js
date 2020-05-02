'use babel';
import { exec } from "child_process"

class SnowflakeProvider {
	constructor () {
		// offer suggestions only when editing any file
		this.selector = '*'

		// except when editing a comment
		this.disableForSelector = '* .comment'

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

	bigBrotherWatch (bufferChange) {

		const pos = bufferChange.range.end
		const editor = atom.workspace.getActiveTextEditor()
		const line = editor.getTextInRange([[pos.row, 0], pos])
		const charAfter = editor.getTextInRange([pos,[pos.row, pos.column+1]])

		//bigBrother doesn't record if there are valid snowflake characters following the cursor
		const snowflakeMatch = line.match(/[^_A-Za-z-]([a-z][a-z-]*-([a-f0-9]{5}))$/) ||
								           line.match(/^([a-z][a-z-]*-([a-f0-9]{5}))$/)


	      //early return if the last text inserted contained a non-flake char
		if (bufferChange.text.match(/[^a-z_0-9-]$/) ||
				//early return if the char after the cursor is a valid flake char
				charAfter.match(/[A-Za-z_0-9-]/) ||
				//early return if the prefix isn't a flake
				snowflakeMatch === null)
					return

		if (hasAlphaAndNumeric(snowflakeMatch[2])) {
			const myProjPath = this.getProjectPath()
			this.addSuggestion(myProjPath,{newBigBro:snowflakeMatch[1]})
			atom.notifications.addInfo(`Big Brother noticed you just wrote a snowflake: <span style="color:black">${snowflakeMatch[1]}</span>`)
		}

    function hasAlphaAndNumeric (h) {
      //hash must have an alpha and a numeric
      return h.match(/[a-f]/) &&
             h.match(/\d/)
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
		const mySuggPath = this.suggestionsCollection[myProjPath]
		const mySuggestions = (mySuggPath) ? [...new Set([...mySuggPath.suggestions.polled,...mySuggPath.suggestions.bigBro])] : []

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

			const currentDirProject = `cd '${projPath}'`
			const runSnowflake = `npx --no-install snowflake-css report`

			exec(`${currentDirProject} && ${runSnowflake}`, this.snowflakeCallback.bind(this,projPath))
		})
	}

	snowflakeCallback (projPath,err,stdout,stderr) {

		//early return if snowflake-css isn't installed in this repo
		if(stderr && stderr.includes("not found: snowflake-css")) return

		const {outputFlakes,lonelyInputFlakes,lonelyTemplateFlakes,error} = (stdout) ? JSON.parse(stdout) : {}

		if(error) return

		this.addSuggestion(projPath,{polled:[...outputFlakes,
																				 ...lonelyInputFlakes,
																				 ...lonelyTemplateFlakes]})
	}

	addSuggestion (projPath,{polled,newBigBro}) {

		if(this.suggestionsCollection[projPath]) {
			if(polled) {
				this.suggestionsCollection[projPath].suggestions.polled = polled
			}
			if(newBigBro) {
				const bigBro = this.suggestionsCollection[projPath].suggestions.bigBro
				this.suggestionsCollection[projPath].suggestions.bigBro = [bigBro[1],bigBro[2],newBigBro]
			}
		} else {
			this.suggestionsCollection[projPath] = {
				projPath: projPath,
				suggestions: {
					polled: polled,
					bigBro: [undefined,undefined,newBigBro]
				}
			}
		}
	}
}
export default new SnowflakeProvider();
