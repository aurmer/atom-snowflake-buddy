'use babel'

export const PACKAGE_NAME = "snowflake-css-atom"
export const CONFIG_FILE_NAME = "snowflake-css.json"
export const BIG_BROTHER_QUEUE_SIZE = 5
export const NOTIFICATION_MESSAGE_PREFIX = `<strong>${PACKAGE_NAME}</strong>`
export const FIND_SNOWFLAKE_PROJECT_PERIOD = 300 //check if file is a in a Snowflake project at min every X seconds

export const SeenFile = class {
  constructor(projPath) {
    this.timestamp = new Date().valueOf()
    this.projectPath = projPath
  }

  get isSnowflakeProject() {
    return this.projectPath !== ""
  }

  isCurrent = () => {
    const now = new Date().valueOf()
    if(now < this.timestamp + FIND_SNOWFLAKE_PROJECT_PERIOD * 1000) {
      return true
    } else {
      this.timestamp = new Date().valueOf() //reset timer for current
      return false
    }
  }
}

export const PACKAGE_CONFIGS = {
  toolingRunDelay: {
    title: 'Snowflake-CSS CLI Tool Frequency',
    description: '\'snowflake-css report\' will run on your active project no more frequently than X seconds.',
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
  notifications: {
    type: 'object',
    properties: {
      bigBrother: {
        title: 'Enable Flake Detection Notifications',
        description: 'When enabled, typing an new flake will produce a notification.',
        type: 'boolean',
        default: true
      },
      hashGen: {
        title: 'Enable Hash Generation Notifications',
        description: 'When enabled, running flake hash generation will produce a notification.',
        type: 'boolean',
        default: true
      },
      snowflakeError: {
        title: 'Error Notifications',
        description: '(Troubleshooting) Display errors from running snowflake-css cli tool.',
        type: 'boolean',
        default: false
      }
    }
  }
}
