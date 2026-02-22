import "./InstrumentsPage.css";
import { Instruments } from "../components/Instruments";
import { InstrumentDetails } from "../components/InstrumentDetails";

export function InstrumentsPage() {
  return (
    <div className="instruments-container">
      <Instruments />
      <InstrumentDetails />
    </div>
  );
}
