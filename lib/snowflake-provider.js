'use babel';

// notice data is not being loaded from a local json file
// instead we will fetch suggestions from this URL
// const API_URL = 'https://cdn.rawgit.com/lonekorean/atom-autocomplete-boilerplate/55500674/data/advanced.json';

class SnowflakeProvider {
	constructor() {
		// offer suggestions only when editing plain text or HTML files
		this.selector = '*'

		// except when editing a comment within an HTML file
		this.disableForSelector = '* .comment'

		// make these suggestions appear above default suggestions
		this.suggestionPriority = 2
	}

	getSuggestions(options) {
		const { editor, bufferPosition } = options
		// console.dir(options) // TODO: remove
		// console.dir(this) // TODO: remove
		// console.dir(prefix) // TODO: remove

		// getting the prefix on our own instead of using the one Atom provides
		let prefix = this.getPrefix(editor, bufferPosition)

		if (prefix.length > 2) {
			return this.findMatchingSuggestions(prefix)
		}
	}

	getPrefix(editor, bufferPosition) {
		// the prefix normally only includes characters back to the last word break
		// which is problematic if your suggestions include punctuation (like "@")
		// this expands the prefix back until a whitespace character is met
		// you can tweak this logic/regex to suit your needs
		let line = editor.getTextInRange([[bufferPosition.row, 0], bufferPosition])
		//non-snowflake char followed by a valid snowflake prefix
		let match = line.match(/[\W_0-9]([A-Za-z][A-Za-z-]*)$/)
		return match ?
		       match[1] :
					 ''
	}

	findMatchingSuggestions(prefix) {
		//TODO get the real suggestions
		const suggestions = [
			'button-primary-CBB65',
			'button-secondary-67CC4',
			'button-sillyclown-7BD13',
			'button-seriousclown-CC717'
		]
		let prefixLower = prefix.toLowerCase()
		let matchingSuggestions = suggestions.filter((suggestion) => {
			let textLower = suggestion.toLowerCase()
			return textLower.startsWith(prefixLower)
		})

		// run each matching suggestion through inflateSuggestion() and return
		return matchingSuggestions.map(this.inflateSuggestion.bind(null,prefix))
	}

	inflateSuggestion(replacementPrefix, suggestion) {
		return {
			text: suggestion,
			type: 'class',
			replacementPrefix: replacementPrefix,
			description: "snowflake identifier"
		};
	}
}
export default new SnowflakeProvider();
