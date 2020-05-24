'use babel'

export const KiB = 1024
export const MiB = KiB * 1024
export const PACKAGE_NAME = 'snowflake-css-atom'
export const CONFIG_FILE_NAME = 'snowflake-css.json'

// big brother's memory size
export const BIG_BROTHER_QUEUE_SIZE = 5

// minimum seconds between "checks" that a file is in a snowflake project
export const FIND_SNOWFLAKE_PROJECT_PERIOD = 300

export const NOTIFICATION_MESSAGE_PREFIX = `<strong>${PACKAGE_NAME}</strong>`
// notification settings keys
export const BIG_BROTHER = 'bigBrother'
export const SNOWFLAKE = 'snowflakeError'
export const HEXTAIL = 'hextailGen'

export const PACKAGE_CONFIGS = {
  delayBetweenRuns: {
    title: 'Snowflake-CSS CLI Tool Frequency',
    description: '\'snowflake-css report\' will run on your active project no more frequently than X seconds.',
    type: 'integer',
    default: 60,
    minimum: 5
  },
  hextailTransparency: {
    title: 'Flake Hextail Transparency',
    description: 'Semi-transparency provides visual feedback for valid flakes.<br>example: flake-a1234 -> "a1234" will be dimmed by X%.',
    type: 'integer',
    default: 50,
    minimum: 0,
    maximum: 99
  },
  notifications: {
    type: 'object',
    properties: {
      [BIG_BROTHER]: {
        title: 'Enable Flake Detection Notifications',
        description: 'When enabled, typing an new flake will produce a notification.',
        type: 'boolean',
        default: false
      },
      [HEXTAIL]: {
        title: 'Enable Hextail Generation Notifications',
        description: 'When enabled, running flake hextail generation will produce a notification.',
        type: 'boolean',
        default: false
      },
      [SNOWFLAKE]: {
        title: 'Enable snowflake-css Notifications',
        description: 'Display info and errors from running the snowflake-css cli tool. Can be helpful for troubleshooting.',
        type: 'boolean',
        default: false
      }
    }
  }
}
