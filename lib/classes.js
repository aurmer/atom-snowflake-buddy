"use babel";

import {
  BIG_BROTHER_QUEUE_SIZE,
  FIND_SNOWFLAKE_PROJECT_PERIOD,
  PACKAGE_NAME,
} from "./constants.js";

export const SnowflakeProject = class {
  constructor(projPath) {
    this.path = projPath;
    this.lastIndexTime = 0;
    this.indexedFlakes = [];
    this.bigBrotherFlakes = Array(BIG_BROTHER_QUEUE_SIZE).fill(undefined);
    this.flakes = [];
  }

  addBigBrotherFlake(flake) {
    // flake validation already occurred

    const flakePre = flake.substring(0, flake.length - 5);
    let isNewFlake = true;

    this.bigBrotherFlakes.forEach((currFlake, idx) => {
      if (
        typeof currFlake === "string" &&
        currFlake.substring(0, currFlake.length - 5) === flakePre
      ) {
        this.bigBrotherFlakes[idx] = flake;
        isNewFlake = false;
      }
    });

    if (isNewFlake) {
      this.bigBrotherFlakes.shift();
      this.bigBrotherFlakes.push(flake);
    }
    this.setFlakes();
  }

  setIndexedFlakes(flakeArray) {
    this.lastIndexTime = new Date().valueOf();
    this.indexedFlakes = flakeArray;
    this.setFlakes();
  }

  setFlakes() {
    this.flakes = [
      ...new Set([...this.indexedFlakes, ...this.bigBrotherFlakes]),
    ];
  }

  isCurrent() {
    const now = new Date().valueOf();
    const delayBetweenRuns =
      1000 * atom.config.get(PACKAGE_NAME).delayBetweenRuns;
    if (now < this.lastIndexTime + delayBetweenRuns) {
      return true;
    } else {
      return false;
    }
  }
};

export const ViewedFile = class {
  constructor(projPath) {
    this.lastCheckedTime = new Date().valueOf();
    this.projectPath = projPath;
  }

  get isSnowflakeProject() {
    return this.projectPath !== "";
  }

  isCurrent() {
    const now = new Date().valueOf();
    if (now < this.lastCheckedTime + FIND_SNOWFLAKE_PROJECT_PERIOD * 1000) {
      return true;
    } else {
      this.lastCheckedTime = new Date().valueOf(); // reset timer for current
      return false;
    }
  }
};
