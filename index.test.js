const photoDir =
  process.platform === "darwin"
    ? "/Users/carltonjoseph/dogs"
    : process.platform === "win32"
    ? "C:/cj/dogs"
    : "/home/carltonj2000/dogs";

jest.spyOn(process, "cwd").mockImplementation(() => photoDir);
jest.setTimeout(15000);

test("photo processing api loaded", async () => {
  const photo = require("./index")();
  console.log("photo cli");
  await photo.resetPhotoDir();
  await photo.processPhotos();
});
