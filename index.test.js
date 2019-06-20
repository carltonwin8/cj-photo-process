const photoDir =
  process.platform === "darwin"
    ? "/Users/carltonjoseph/dogs"
    : process.platform === "win32"
    ? "C:/cj/dogs"
    : "/home/carltonj2000/dogs";

jest.spyOn(process, "cwd").mockImplementation(() => photoDir);
jest.setTimeout(15000);

let photo;

beforeAll(() => (photo = require("./index")()));
test("reset", () => photo.resetPhotoDir());
test("process", () => photo.processPhotos());
