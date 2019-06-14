const path = require("path");
const fs = require("fs");
const { execSync, exec } = require("child_process");

const dcraw =
  process.platform === "darwin" ? "/usr/local/bin/dcraw" : "/usr/bin/dcraw";

const convert =
  process.platform === "darwin"
    ? "/usr/local/bin/convert"
    : "/usr/local/bin/convert";

async function getFiles(cwd, total, totaljpeg) {
  if (!fs.existsSync(cwd))
    return await Promise.reject(`directory does not exist => ${cwd}`);
  const files = fs.readdirSync(cwd);
  rawFiles = files.filter(file => /.CR2$/.test(file));
  jpgFiles = files.filter(file => /.jpe?g$/i.test(file));
  if (rawFiles.length < 1 && jpgFiles.length < 1)
    return await Promise.reject(`no raw/jpg files found in => ${cwd}`);
  total(rawFiles.length);
  totaljpeg(jpgFiles.length);
  return { rawFiles, jpgFiles };
}

function develope(cwd, size, extractRaw, convertMsg, jpeg, rawFiles, jpgFiles) {
  const rawDir = path.join(cwd, "raw");
  const jpgDir = path.join(cwd, "jpg");
  const resizeDir = path.join(cwd, "resized", "size_" + size);

  // setup directories
  let p = Promise.resolve()
    .then(
      () =>
        new Promise((resolve, reject) => {
          try {
            if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir);
            if (!fs.existsSync(jpgDir)) fs.mkdirSync(jpgDir);
            if (!fs.existsSync(resizeDir)) execSync(`mkdir -p ${resizeDir}`);
            return resolve();
          } catch (e) {
            reject(e);
          }
        })
    )
    .catch(e =>
      console.error("Process photos failed making directories with:", e.message)
    );
  // handle raw files
  p = p.then(() => {
    let p1 = Promise.resolve();
    rawFiles.forEach((file, idx) => {
      p1 = p1.then(
        () =>
          new Promise(resolve => {
            execSync(`${dcraw} -e ${file}`, { cwd });
            fs.renameSync(path.join(cwd, file), path.join(rawDir, file));
            const baseName = file.split(".")[0];
            const fileOut = baseName + ".JPG";
            const thumb = baseName + ".thumb.jpg";
            fs.renameSync(path.join(cwd, thumb), path.join(jpgDir, fileOut));
            extractRaw(idx + 1);

            const cmd = `${convert} "${path.join(
              jpgDir,
              fileOut
            )}" -resize ${size} "${path.join(resizeDir, fileOut)}"`;

            exec(cmd, () => {
              convertMsg(1);
              return resolve();
            });
          })
      );
    });
    return p1;
  });
  // handle jpg files
  p = p.then(() => {
    let p1 = Promise.resolve();
    jpgFiles.forEach((file, idx) => {
      p1 = p1.then(
        () =>
          new Promise(resolve => {
            const ori = path.join(cwd, file);
            const mved = path.join(jpgDir, file);
            fs.renameSync(ori, mved);
            const cmd = `${convert} "${mved}" -resize ${size} "${path.join(
              resizeDir,
              file
            )}"`;

            exec(cmd, () => {
              jpeg(1);
              return resolve();
            });
          })
      );
    });
    return p1;
  });
  return p;
}

function reset(cwd, total, extractRaw, convertMsg, totaljpeg, jpeg) {
  if (fs.existsSync(`${cwd}ori`)) {
    execSync(`rm -rf ${cwd}/jpg`);
    execSync(`rm -rf ${cwd}/raw`);
    execSync(`rm -rf ${cwd}/resized`);
    execSync(`cp -R  ${cwd}ori/*.CR2 ${cwd}`);
    extractRaw(0);
    convertMsg(0);
    total(0);
    totaljpeg(0);
    jpeg(0);
  } else {
    console.error(`Failed! Missing ${cwd}ori.`);
  }
}

module.exports = {
  getFiles,
  develope,
  reset
};
