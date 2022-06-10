# snowflake-buddy for Atom
Atom package supporting the Snowflake CSS strategy. Offers automation of hextails to alleviate copy+paste. test

### Snowflake CSS

[Snowflake CSS](https://github.com/oakmac/snowflake-css)
is a styling strategy and tool set designed to simplify the CSS in your
web app. Snowflake CSS is designed by [Chris Oakman](https://github.com/oakmac).

### Current State

All requested features have been implemented. Please submit issues for bugs or
feature/behavior requests.

### Features

1. flake hextail generation with `Ctrl-F7`
   - try generating a hextail twice in a row! (it will re-roll the random hextail)
1. flake typing detection
1. caching existing flakes for auto-complete suggestions
1. flake suggestions tracked separately by project (determined by location of 'snowflake-css.json' file)
1. flake styling with hextail dimmed slightly (adjustable in settings)
1. optional info/error notifications for increased feedback
   - try turning on notifications as you get familiar with package behavior
1. a list of cases I have considered
   - renaming a file while it is open will trigger a snowflake-css run
   - selecting panes and tabs which are not files of a "snowflake project" will temporarily disable all features
   - having more than one cursor disables features

### Use Requirements

- You must have `snowflake-css` installed and properly initialized in your
  project. Failed attempts to run `snowflake-css` on your project will die
  silently unless you turn on package error notifications.
