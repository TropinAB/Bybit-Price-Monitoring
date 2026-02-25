// InstrumentsPage.test.tsx
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { InstrumentsPage } from "./InstrumentsPage";

// Мокаем дочерние компоненты
jest.mock("../components/Instruments", () => ({
  Instruments: () => <div data-testid="mock-instruments">Instruments Mock</div>,
}));

jest.mock("../components/InstrumentDetails", () => ({
  InstrumentDetails: () => (
    <div data-testid="mock-instrument-details">InstrumentDetails Mock</div>
  ),
}));

describe("InstrumentsPage", () => {
  it("должен рендерить оба компонента", () => {
    render(
      <MemoryRouter>
        <InstrumentsPage />
      </MemoryRouter>,
    );

    expect(screen.getByTestId("mock-instruments")).toBeInTheDocument();
    expect(screen.getByTestId("mock-instrument-details")).toBeInTheDocument();
  });
});
