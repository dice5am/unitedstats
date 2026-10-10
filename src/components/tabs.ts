export type TabId = "economy" | "labour" | "demographics" | "housing" | "trade" | "environment" | "health" | "innovation" | "education";
export const TABS: { id: TabId; label: string; desc: string }[] = [
  { id: "economy", label: "Economy", desc: "Growth, living standards, prices, rates, debt" },
  { id: "labour", label: "Labour", desc: "Jobs, unemployment, pay and hours" },
  { id: "demographics", label: "Demographics", desc: "Ageing, births and migration" },
  { id: "housing", label: "Housing", desc: "House prices against incomes, household borrowing" },
  { id: "trade", label: "Trade", desc: "Openness and who runs surpluses" },
  { id: "environment", label: "Environment & energy", desc: "Emissions and how electricity is made" },
  { id: "health", label: "Health", desc: "Spending against how long people live" },
  { id: "innovation", label: "Innovation", desc: "Who pays for research" },
  { id: "education", label: "Education", desc: "The generation gap in degrees" },
];
export const MOBILE_INLINE = 4; // Economy · Labour · Demographics · Housing · More
