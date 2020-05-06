'use babel'

export const PACKAGE_NAME = "snowflake-css-atom"

export const PACKAGE_CONFIGS = {
  pollingRate: {
    title: 'Snowflake-CSS CLI Tool Polling Rate',
    description: '\'snowflake-css report\' will run on your active project this frequently (in seconds).',
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
  nestedProjectDepth: {
    title: 'Max Path Depth',
    description: 'Projects using snowflake-css aren\'t necessarily at the root of the Project Folder. Snowflake-css-atom will search for projects with \'snowflake-css.json\' as far as X folders deep.',
    type: 'integer',
    default: 5,
    minimum: 0,
    maximum: 20
  },
  notifications: {
    type: 'object',
    properties: {
      enableBigBrotherNotifications: {
        title: 'Enable Flake Detection Notifications',
        description: 'When enabled, typing an new flake will produce a notification.',
        type: 'boolean',
        default: true
      },
      enableHashGeneratorNotifications: {
        title: 'Enable Hash Generation Notifications',
        description: 'When enabled, running flake hash generation will produce a notification.',
        type: 'boolean',
        default: true
      }
    }
  }
}
