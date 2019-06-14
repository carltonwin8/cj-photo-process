#!/usr/bin/env node

const fs = require("fs");
let inquirer = require("inquirer");
const progress = require("progress");

const photo = require("./api");

let totalv = 0;
let totaljpegv = 0;
const total = value => (totalv = value);
const totaljpeg = value => (totaljpegv = value);
const extractRaw = (_, bar) => bar && bar.tick();
const convertMsg = (_, bar) => bar && bar.tick();
const jpeg = (_, bar) => bar && bar.tick();

const actions = [
  { name: "Process Photos", cmd: processPhotos },
  { name: "Reset Photo Directory", cmd: resetPhotoDir }
];

if (require.main === module) {
  inquirer
    .prompt([
      {
        type: "list",
        message: "Select Action",
        name: "action",
        choices: actions
      }
    ])
    .then(answers =>
      actions
        .filter(action => action.name === answers.action)[0]
        .cmd({ inquirer })
    )
    .catch(e => console.error("Photo processing failed with: ", e.message));
}

function resetPhotoDir() {
  photo.reset(process.cwd(), total, extractRaw, convertMsg, totaljpeg, jpeg);
  console.log("reset photos dir");
}

async function processPhotos() {
  console.log("processing photos");
  try {
    const cwd = process.cwd();
    const files = await photo.getFiles(cwd, total, totaljpeg);
    const bar = new progress(":bar", { total: totalv * 2 + totaljpegv });
    return await photo.develope(
      cwd,
      "1620x1080",
      val => extractRaw(val, bar),
      val => convertMsg(val, bar),
      val => jpeg(val, bar),
      files.rawFiles,
      files.jpgFiles
    );
  } catch (e) {
    console.log("photo processing failed with: ", e);
  }
}

module.exports = params => {
  // below for using the api module directly - gui use
  if (params && params.getFunctions) return photo;
  // below for and external cli call using the cli code in this module
  if (params && params.inquirer) inquirer = params.inquirer;
  // below for testing the cli code in this module
  return { processPhotos, resetPhotoDir };
};
