import Dashboard from "./Dashboard";
import proceedings from "../data/proceedings.json";
import developments from "../data/developments.json";
import bills from "../data/bills.json";
import meta from "../data/meta.json";

// Rebuilt on every ingestion commit, so the page always reflects the latest data.
export const dynamic = "force-static";

export default function Page() {
  return (
    <Dashboard
      proceedings={proceedings}
      developments={developments}
      bills={bills}
      meta={meta}
    />
  );
}
