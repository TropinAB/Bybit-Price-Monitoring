import { App } from "./App";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router";

describe("Check App", () => {
  it("some test", () => expect(App).toBeInstanceOf(Function));
  it("some test", () => {
    const { container } = render(
      <MemoryRouter>
        <App />
      </MemoryRouter>,
    );
    expect(container).not.toBeNull();
  });
});
