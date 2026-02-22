import { Instruments } from "../components/Instruments";
import "./InstrumentsPage.css";

export function InstrumentsPage() {
  return (
    <div className="instruments-container">
      <Instruments />
      <div className="instrument-details-section"></div>
    </div>
  );
}
