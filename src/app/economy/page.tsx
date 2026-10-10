import data from "@/data/c1_labour_series.json";
import App from "@/src/components/App";
export const metadata = { title: "Economy · United Stats" };
export default function Page() { return <App data={data as never} tab="economy" />; }
