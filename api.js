const path = require("path");
const fs = require("fs-extra");
const { execSync, exec } = require("child_process");

const dcraw =
  process.platform === "darwin"
    ? "/usr/local/bin/dcraw"
    : process.platform === "win32"
    ? 'C:/"Program Files"/ImageMagick-7.0.8-Q16/dcraw'
    : "/usr/local/bin/convert";

const convert =
  process.platform === "darwin"
    ? "/usr/local/bin/convert"
    : process.platform === "win32"
    ? 'C:/"Program Files"/ImageMagick-7.0.8-Q16/magick convert'
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

async function develope(
  cwd,
  size,
  extractRaw,
  convertMsg,
  jpeg,
  rawFiles,
  jpgFiles
) {
  const rawDir = path.join(cwd, "raw");
  const jpgDir = path.join(cwd, "jpg");
  const resizeDir = path.join(cwd, "resized", "size_" + size);

  // setup directories
  let p = Promise.resolve()
    .then(
      async () =>
        new Promise(async (resolve, reject) => {
          try {
            if (!fs.existsSync(rawDir)) fs.mkdirSync(rawDir);
            if (!fs.existsSync(jpgDir)) fs.mkdirSync(jpgDir);
            if (!fs.existsSync(resizeDir)) await fs.mkdirp(`${resizeDir}`);
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
  rawFiles.forEach((file, idx) => {
    p = p.then(
      () =>
        new Promise(resolve => {
          execSync(`${dcraw} -e ${file}`, { cwd });
          fs.renameSync(path.join(cwd, file), path.join(rawDir, file));
          return resolve();
        })
    );
    p = p.then(
      () =>
        new Promise(resolve => {
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

  // handle jpg files
  jpgFiles.forEach((file, idx) => {
    p = p.then(
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
  return p;
}

async function reset(cwd, total, extractRaw, convertMsg, totaljpeg, jpeg) {
  if (fs.existsSync(`${cwd}ori`)) {
    await fs.remove(`${cwd}/jpg`);
    await fs.remove(`${cwd}/raw`);
    await fs.remove(`${cwd}/resized`);
    await fs.copy(`${cwd}ori`, `${cwd}`);
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
