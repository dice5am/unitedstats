import econ from "@/data/econ_gdp_series.json";
import EconomyTab from "@/src/components/EconomyTab";
export const metadata = { title: "Economy · unitedstats" };
export default function Page() { return <EconomyTab econ={econ as never} />; }
