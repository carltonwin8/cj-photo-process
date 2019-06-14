const photoDir = "/Users/carltonjoseph/dogs";
jest.spyOn(process, "cwd").mockImplementation(() => photoDir);
jest.setTimeout(15000);

test("photo processing api loaded", async () => {
  const photo = require("./index")();
  console.log("photo cli");
  await photo.processPhotos();
  await photo.resetPhotoDir();
});
