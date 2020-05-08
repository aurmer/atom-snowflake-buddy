# Atom extension for Snowflake CSS

## Snowflake CSS

[Snowflake CSS](https://github.com/oakmac/snowflake-css) is a styling strategy and tool set designed to simplify the CSS in your web app. Snowflake CSS is designed by [Chris Oakman](https://github.com/oakmac).

## Current State

This package is currently under development. All features have been implemented,
and it needs some alpha testing to see if it holds up.

## Features

1. flake hash generation with `Ctrl-F7`
 - try generating a hash twice in a row
1. flake typing detection
1. caching existing flakes for auto-complete suggestions
1. flake suggestions tracked separately by "snowflake project"
1. optional info and error notifications for increased feedback
 - try turning on notifications on your first use until you see what is going on
1. a list of edge cases I have considered
 - renaming a file while it is open will trigger a snowflake-css run
 - selecting panes and tabs which are not files of a "snowflake project" will disable all features

## Coming Features

1. adding styling to the hash of each valid flake, providing visual confirmation on what are the flakes in your code.

## Use Requirements

- you must have `snowflake-css` installed and properly initialized in your
project. failures die silently unless you turn on debugging error notifications.
