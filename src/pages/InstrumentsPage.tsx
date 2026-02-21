import { useFetcher, useOutletContext } from "react-router";

interface ContextType {
  refreshInterval: number;
}

export function InstrumentsPage() {
  const { refreshInterval } = useOutletContext<ContextType>();
  useFetcher;

  return <>InstrumentsPage {refreshInterval}</>;
}
