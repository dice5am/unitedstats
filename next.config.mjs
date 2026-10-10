// "/" now opens Economy. The old root page was Labour, so any old Labour link (view/win/on, u_*, j_*) at "/"
// goes to /labour with its query intact (Next carries the query string through redirects).
const labourKeys = ["view", "win", "on", "u_win", "u_on", "j_view", "j_win", "j_on"];
/** @type {import('next').NextConfig} */
export default {
  devIndicators: false,
  async redirects() {
    return [
      ...labourKeys.map((key) => ({ source: "/", has: [{ type: "query", key }], destination: "/labour", permanent: false })),
      { source: "/", destination: "/economy", permanent: false },
      // Round 4 interim nine-tab routes -> the five locked tabs (Round 4b)
      ...[["demographics", "society"], ["health", "society"], ["education", "society"], ["housing", "finance"], ["trade", "finance"], ["innovation", "economy"]]
        .map(([a, b]) => ({ source: `/${a}`, destination: `/${b}`, permanent: false })),
    ];
  },
};
