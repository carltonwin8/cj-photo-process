const photoDir =
  process.platform === "darwin"
    ? "/Users/carltonjoseph/dogs"
    : process.platform === "win32"
    ? "C:/cj/dogs"
    : "/home/carltonj2000/dogs";

jest.spyOn(process, "cwd").mockImplementation(() => photoDir);

let photo;

beforeAll(() => (photo = require("./index")()));
test("reset", () => photo.resetPhotoDir());
jest.setTimeout(15000);
test.skip("process", () => photo.processPhotos());
