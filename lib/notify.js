'use babel'

import { PACKAGE_NAME,NOTIFICATION_MESSAGE_PREFIX,BIG_BROTHER,HEXTAIL,SNOWFLAKE } from "./constants.js"



function isNotifyEnabled (prop) {
  return atom.config.get(PACKAGE_NAME).notifications[prop]
}

export const notifyNewFlakeDetected = (flake) => {
  if (isNotifyEnabled(BIG_BROTHER)) {
    atom.notifications.addInfo(NOTIFICATION_MESSAGE_PREFIX,{	icon: "info",
                                                              detail: `New flake: ${flake}`})
  }
}

export const notifyHextailGen = (detailMessage) => {
  if(isNotifyEnabled(HEXTAIL)) {
    atom.notifications.addInfo(NOTIFICATION_MESSAGE_PREFIX,{icon:'info',
    detail: detailMessage})
  }
}

export const notifySnowflakeNotFound = (filePath) => {
  if(isNotifyEnabled(SNOWFLAKE)) {
    atom.notifications.addError(NOTIFICATION_MESSAGE_PREFIX,{	icon: "file-directory",
                                                              dismissable:true,
                                                              detail: `'snowflake-css.json' wasn't found in the parent directories of the file: "${filePath}"`})
  }
}

export const notifySnowflakeError = (errorDetail,errorStack) => {
  if(isNotifyEnabled(SNOWFLAKE) && (errorDetail !== "" || errorStack !== "")) {
    atom.notifications.addError(NOTIFICATION_MESSAGE_PREFIX,{ icon: "file-directory",
                                                              dismissable:true,
                                                              stack:errorStack,
                                                              detail:errorDetail})
  }
}

export const notifySnowflakeSuccess = (projPath) => {
  if (isNotifyEnabled(SNOWFLAKE)) {
    atom.notifications.addInfo(NOTIFICATION_MESSAGE_PREFIX,{detail: `snowflake-css success: ${projPath}`})
  }
}
