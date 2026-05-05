const path = require('path')

const config = {
  APP_NAME: 'TABuddy',
  APP_NAME_CN: '助教助手',
  APP_VERSION: '1.0.0',

  TARGET_URL: 'https://www.tabuddy.top',

  FEEDBACK_URL: '',

  FILE_SERVER_URL: '',

  WINDOW_WIDTH: 960,
  WINDOW_HEIGHT: 680,
  WINDOW_MIN_WIDTH: 480,
  WINDOW_MIN_HEIGHT: 400,

  TITLEBAR_HEIGHT: 32,

  ICON_PATH: path.join(__dirname, 'assets', 'icon.png'),
  ICO_PATH: path.join(__dirname, 'assets', 'icon.ico'),
  LOCAL_ICON_PATH: path.join(__dirname, '..', 'img', 'app图标.png'),

  UPDATE_FEED_URL: 'https://www.tabuddy.top/releases',

  AUTO_START_ENABLED: false,

  DISABLE_DEVTOOLS: true,
  DISABLE_RIGHT_CLICK: true,
}

module.exports = config
