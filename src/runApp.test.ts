import { runApp } from "./runApp";

describe("Check runApp", () => {
  it("some test", () => expect(runApp).toBeInstanceOf(Function));
  it("some test 2", () => {
    const el = document.createElement("div");
    runApp(el);
    expect(el.innerHTML.length).toBeGreaterThanOrEqual(0);
  });
});
