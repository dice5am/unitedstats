import data from "@/data/c1_labour_series.json";
import unemp from "@/data/c1_unemployment_rate.json";
import rate from "@/data/c1_employment_rate.json";
import econ from "@/data/econ_gdp_series.json";
import LabourTab from "@/src/components/LabourTab";
export const metadata = { title: "Labour · unitedstats" };
// Only the population block of the economy file ships to this page (jobs per capita denominator).
const pop = { population: econ.population };
// Employment rate: only the quarterly series feed the recovery scorecard.
const rateQ = { data_as_of: rate.data_as_of, quarterly: rate.quarterly };
export default function Page() { return <LabourTab data={data as never} unemp={unemp as never} pop={pop as never} rate={rateQ as never} />; }
