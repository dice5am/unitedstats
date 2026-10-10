import data from "@/data/c1_labour_series.json";
import unemp from "@/data/c1_unemployment_rate.json";
import econ from "@/data/econ_gdp_series.json";
import App from "@/src/components/App";
export const metadata = { title: "Economy · unitedstats" };
export default function Page() { return <App data={data as never} unemp={unemp as never} econ={econ as never} tab="economy" />; }
