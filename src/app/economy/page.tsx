import data from "@/data/c1_labour_series.json";
import rate from "@/data/c1_employment_rate.json";
import App from "@/src/components/App";
export const metadata = { title: "Economy · unitedstats" };
export default function Page() { return <App data={data as never} rate={rate as never} tab="economy" />; }
