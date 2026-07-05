// Educational content for the Intelligence learning hub. Lessons, an interactive
// flow-diagram library, and a glossary — a browsable primer on California energy,
// governance, the CPUC/CEC/CARB, and legislation. Reference material; verify
// specifics (current officeholders, exact dates, live rule text) against sources.

export const MODULES = [
  {
    id: "governance", icon: "🏛️", title: "California Governance 101",
    summary: "How the state is organized — the three branches, the Governor's agencies, and where energy & climate power actually sits.",
    kicker: "§ 01 · Foundations",
    stats: [{ num: "3", lbl: "branches of government" }, { num: "2", lbl: "agency umbrellas" }, { num: "1", lbl: "independent commission" }],
    pullquote: "The Legislature writes the rules; the agencies make them real.",
    diagram: "govTree",
    sections: [
      { h: "Three branches", body: "Legislative (a two-house Legislature: 80-member Assembly, 40-member Senate), Executive (the Governor plus constitutional officers and the departments/boards under them), and Judicial. The Legislature writes statutes; agencies implement them through regulations and programs." },
      { h: "The agency umbrellas", body: "Most executive bodies sit under 'super-agencies.' Two matter most for energy & climate: CalEPA (California Environmental Protection Agency) houses CARB, the water boards, CalRecycle, and others; CNRA (California Natural Resources Agency) houses the CEC and more. These umbrellas coordinate policy and report to the Governor.", deep: "There are about a dozen cabinet-level agencies in all — Transportation, Health & Human Services, Business & Consumer Services, and so on. Each is led by a Secretary the Governor appoints. The 'super-agency' model exists so the Governor can steer dozens of departments through a handful of Secretaries rather than managing each board directly. For energy work you'll mostly touch CalEPA and CNRA, but the Labor, Housing, and Transportation agencies show up too — e.g., building electrification intersects with the Department of Housing, and EV policy runs through Caltrans and the DMV." },
      { h: "The CPUC is different", body: "The California Public Utilities Commission is an INDEPENDENT agency created by the state Constitution — not under CalEPA or CNRA. It has both quasi-legislative power (making rules) and quasi-judicial power (deciding cases), which is why its process looks like a courtroom crossed with a rulemaking.", deep: "Its independence comes from Article XII of the California Constitution, which created the Commission and gave the Legislature authority to confer additional powers on it. Practically, that means the Governor can't simply order the CPUC to set a particular rate, and its decisions are reviewed directly by the appellate courts rather than through the normal agency-appeal channels. This constitutional footing is why the CPUC can run a quasi-judicial process — with sworn testimony, cross-examination, and ex parte rules — that other California agencies can't." },
    ],
    keyPoints: ["Legislature makes law; agencies implement it.", "CalEPA → CARB; CNRA → CEC.", "CPUC is constitutionally independent."],
    ask: ["Why is the CPUC independent from the Governor's agencies?", "What's the difference between CalEPA and CNRA?"],
  },
  {
    id: "cpuc", icon: "⚡", title: "The CPUC — Utilities & Energy Regulation",
    summary: "Who the CPUC regulates, how a proceeding works, and the docket types you'll see (R., I., A., C.).",
    kicker: "§ 02 · The Regulator",
    stats: [{ num: "5", lbl: "Commissioners" }, { num: "6-yr", lbl: "staggered terms" }, { num: "4", lbl: "big investor-owned utilities" }],
    pullquote: "A CPUC proceeding is a courtroom crossed with a rulemaking.",
    diagram: "cpucFlow",
    sections: [
      { h: "What it regulates", body: "Investor-owned utilities (IOUs) — PG&E, SCE, SDG&E for electricity, SoCalGas & SDG&E for gas — plus telecom, water, and some transportation. It sets the rates these utilities charge and the programs they run (efficiency, DER compensation, procurement, reliability)." },
      { h: "Who's in charge", body: "Five Commissioners appointed by the Governor to staggered six-year terms, confirmed by the Senate. Administrative Law Judges (ALJs) run the proceedings. The Public Advocates Office (Cal Advocates) is an independent ratepayer advocate inside the CPUC." },
      { h: "Docket types", body: "Rulemaking (R.) — opened by an Order Instituting Rulemaking (OIR), the main policy vehicle. Investigation (I.) — an OII. Application (A.) — a utility asks for something, like a General Rate Case. Complaint (C.). A number like R.25-04-010 means: Rulemaking, opened 2025, month 04, sequence 010.", deep: "Categorization matters more than it looks: at the scoping stage every proceeding is labeled quasi-legislative, ratesetting, or adjudicatory, and that label sets the ex parte rules. Ratesetting cases have strict reporting and 'quiet periods' before a vote; quasi-legislative rulemakings are looser. When you see a filing titled 'Ex Parte Notice' in a docket, that's a party disclosing a private meeting with a Commissioner as the category requires. Advice Letters are a separate, faster track — a utility files one to implement something already authorized, and Energy Division disposes of it by resolution rather than a full proceeding." },
      { h: "How a proceeding moves", body: "See the interactive lifecycle diagram — from OIR, through scoping and record-building (comments, workshops, ALJ rulings), to a Proposed Decision, comments on it, and a Commission vote that produces a final Decision (D.)." },
    ],
    keyPoints: ["Regulates IOUs' rates & programs.", "5 Commissioners, run by ALJs.", "R./I./A./C. docket types.", "OIR → PD → Decision."],
    ask: ["Walk me through a CPUC rulemaking from start to finish.", "What is a Proposed Decision and how can parties respond?", "What's the difference between a rulemaking and an investigation?"],
  },
  {
    id: "cec", icon: "🔋", title: "The CEC — Energy Standards & Planning",
    summary: "California's energy planning agency: building & appliance efficiency standards, forecasting, and power-plant siting.",
    kicker: "§ 03 · Standards & Planning",
    stats: [{ num: "~3 yr", lbl: "building-code cycle" }, { num: "Title 24", lbl: "building energy standards" }, { num: "2 yr", lbl: "IEPR planning cadence" }],
    pullquote: "The CPUC regulates utilities; the CEC sets the standards everyone builds to.",
    diagram: null,
    sections: [
      { h: "Its role", body: "The California Energy Commission is the state's primary energy policy and planning body, within CNRA, led by five Commissioners. Where the CPUC regulates utilities, the CEC sets standards and plans for the whole energy system." },
      { h: "Efficiency standards", body: "Building Energy Efficiency Standards live in Title 24, Part 6 and are updated on roughly a three-year cycle (e.g., the 2022, 2025, and 2028 code cycles) — these increasingly push electrification and demand flexibility. Appliance standards are Title 20. Load Management Standards encourage shifting demand to cheaper/cleaner times." },
      { h: "Planning & siting", body: "The biennial Integrated Energy Policy Report (IEPR) assesses trends and sets policy direction. The CEC also licenses large power plants; under AB 205 there's an opt-in certification path for big solar and storage projects." },
    ],
    keyPoints: ["Sets Title 24 (buildings) & Title 20 (appliances).", "Publishes the biennial IEPR.", "Licenses large generation."],
    ask: ["How do the CEC's building standards drive electrification?", "What is the IEPR and why does it matter?"],
  },
  {
    id: "carb", icon: "🌱", title: "CARB — Climate & Air",
    summary: "The Air Resources Board: greenhouse-gas targets, cap-and-trade, the Low Carbon Fuel Standard, vehicle and appliance rules.",
    kicker: "§ 04 · Climate & Air",
    stats: [{ num: "2045", lbl: "carbon-neutral target" }, { num: "35", lbl: "local air districts" }, { num: "16", lbl: "board members" }],
    pullquote: "One board sets the price of carbon and the future of the tailpipe.",
    diagram: null,
    sections: [
      { h: "Its role", body: "The California Air Resources Board, within CalEPA, handles air quality and climate. A 16-member board sets rules; 35 regional/local air districts (like South Coast AQMD) handle local air issues." },
      { h: "Climate programs", body: "AB 32 (2006) and SB 32 set the state's greenhouse-gas targets; CARB's Scoping Plan is the roadmap to meet them. Cap-and-Trade puts a price on carbon; the Low Carbon Fuel Standard (LCFS) drives cleaner transportation fuels.", deep: "AB 32 required California to cut emissions to 1990 levels by 2020 (hit early); SB 32 set a 40%-below-1990 target for 2030; and the 2022 Scoping Plan charts the course to carbon neutrality by 2045. Cap-and-trade works by auctioning a shrinking number of allowances — each worth one ton of CO₂ — and letting companies trade them, so the market finds the cheapest cuts first; auction proceeds flow into the Greenhouse Gas Reduction Fund that pays for things like transit and rebates. The LCFS assigns each fuel a 'carbon intensity' score and requires the pool of transportation fuels to get cleaner every year, generating tradable credits that subsidize EVs, biofuels, and renewable hydrogen." },
      { h: "Rules that touch buildings & vehicles", body: "CARB sets zero-emission vehicle rules (Advanced Clean Cars/Trucks/Fleets) and zero-NOx standards for space and water heaters — directly relevant to building decarbonization. New corporate climate-disclosure laws (SB 253, SB 261) are implemented here too." },
      { h: "How it makes rules", body: "Unlike the CPUC, CARB follows the standard California Administrative Procedure Act: a 45-day public notice, comment period, a board hearing, adoption, and review by the Office of Administrative Law." },
    ],
    keyPoints: ["Scoping Plan = climate roadmap.", "Cap-and-trade + LCFS.", "Zero-NOx appliance & ZEV rules.", "Follows the standard APA."],
    ask: ["How does CARB's rulemaking differ from the CPUC's?", "What are SB 253 and SB 261?", "How does cap-and-trade actually work?"],
  },
  {
    id: "legislation", icon: "📜", title: "How a Bill Becomes Law in California",
    summary: "The two-year session, committees, deadlines, and the path from introduction to the Governor's desk.",
    kicker: "§ 05 · Lawmaking",
    stats: [{ num: "2 yr", lbl: "legislative session" }, { num: "120", lbl: "legislators (80 + 40)" }, { num: "5", lbl: "stages to become law" }],
    pullquote: "A bill has to survive two houses, the money committee, and the Governor's pen.",
    diagram: "billFlow",
    sections: [
      { h: "The two-year session", body: "California runs a two-year legislative session (e.g., 2025–2026). Bills can carry over between the two years — a 'two-year bill.' Bills that miss their deadlines are effectively dead until reintroduced." },
      { h: "The path", body: "A bill is introduced, heard in policy committee(s) in its house of origin, sent to the Appropriations committee if it costs money, voted on the floor, then repeats the whole process in the second house. Differences are reconciled ('concurrence'), and it goes to the Governor." },
      { h: "The Governor", body: "The Governor can sign it, veto it, or let it become law without a signature. A signed bill is 'chaptered' (given a chapter number) and becomes law. This tracker maps LegiScan status codes to stages: Introduced → Committee → Floor → Enrolled → Signed, with Vetoed/Failed as terminal." },
    ],
    keyPoints: ["Two-year session; bills carry over.", "Policy → fiscal → floor, twice.", "Governor signs, vetoes, or lets pass.", "Signed = 'chaptered.'"],
    ask: ["What are the key legislative deadlines each year?", "What does it mean when a bill is 'enrolled'?", "Which committees hear energy bills?"],
  },
  {
    id: "energy-system", icon: "🔌", title: "The California Energy System",
    summary: "Utilities, CCAs, the grid operator, and distributed energy — and which agency governs each piece.",
    kicker: "§ 06 · The System",
    stats: [{ num: "~67%", lbl: "clean grid (2024)" }, { num: "~2×", lbl: "demand growth by 2045" }, { num: "14M", lbl: "served by CCAs" }],
    pullquote: "Electrify a home today and it rides the decarbonizing grid automatically.",
    compare: { title: "Efficiency — moving heat vs. making it", rows: [{ label: "Gas furnace", value: "85%", pct: 28, color: "#8a857a" }, { label: "Air-source heat pump", value: "300%+", pct: 100, color: "#2f8f4e" }] },
    breakdown: {
      title: "California emissions by sector",
      note: "Decarbonization means moving four buckets at once — electrifying buildings and cars only helps if the grid underneath them cleans up too.",
      items: [
        { label: "Transportation", pct: 37, color: "#2e5e8c", note: "cars, trucks, planes, ships" },
        { label: "Buildings", pct: 24, color: "#e0a800", note: "gas furnaces, water heaters, stoves" },
        { label: "Industry", pct: 24, color: "#c0392b", note: "refineries, cement, food processing" },
        { label: "Electricity (grid)", pct: 15, color: "#2f8f4e", note: "the gas plants still on the system" },
      ],
    },
    diagram: "agencyMap",
    sections: [
      { h: "Who delivers power", body: "IOUs (investor-owned, e.g., PG&E) and POUs (publicly-owned, e.g., LADWP, SMUD) run the wires. Community Choice Aggregators (CCAs) — local governments — increasingly buy the electricity while the IOU still delivers it. The CAISO (grid operator) runs the transmission grid and wholesale market." },
      { h: "Distributed energy (DERs)", body: "Rooftop solar, batteries, EV chargers, and demand response are 'distributed energy resources.' Net billing sets how solar exports are compensated; demand flexibility and dynamic rates reward shifting use to cleaner, cheaper hours. Aggregated DERs can form a 'virtual power plant.'", deep: "The big shift was NEM 3.0 (the 'Net Billing Tariff,' 2023): earlier net metering paid rooftop solar owners the full retail rate for exports, but the successor pays closer to the wholesale 'avoided cost,' which is much lower midday when solar floods the grid and much higher in the evening. That change deliberately pushes customers to pair solar with batteries — store the cheap midday sun and export or self-consume during the expensive evening ramp. The same logic drives demand flexibility: California's grid problem isn't a shortage of daytime energy, it's the steep 'duck curve' evening ramp when solar drops off and demand peaks." },
      { h: "Who governs what", body: "Utility rates, DER compensation, procurement, and reliability → CPUC. Efficiency standards, planning, siting → CEC. GHG/climate, fuels, vehicle & appliance emissions → CARB. The Legislature sets the statutes that direct all of them. See the map diagram." },
    ],
    keyPoints: ["IOUs vs POUs vs CCAs.", "DERs: solar, storage, EVs, demand response.", "CPUC=rates, CEC=standards, CARB=climate."],
    ask: ["What is a CCA and how does it change who I buy power from?", "What is net billing and how did it change from net metering?", "What is demand flexibility?"],
  },
  {
    id: "building-decarb", icon: "🏠", title: "Building Decarbonization",
    summary: "Why buildings are a quarter of California's emissions, what 'electrification' actually means, and the heat pump at the center of it.",
    kicker: "§ 07 · Buildings",
    stats: [{ num: "~24%", lbl: "of state emissions" }, { num: "3-4×", lbl: "heat-pump efficiency" }, { num: "2045", lbl: "carbon-neutral deadline" }],
    pullquote: "You can't hit a carbon target while installing a new gas furnace that runs for 20 years.",
    breakdown: {
      title: "Where a typical home's energy goes",
      note: "Space and water heating are the fossil-gas heart of a house — and exactly what heat pumps replace.",
      items: [
        { label: "Space heating", pct: 43, color: "#c0392b", note: "furnace / boiler" },
        { label: "Water heating", pct: 19, color: "#e0a800", note: "gas or electric tank" },
        { label: "Cooling & appliances", pct: 23, color: "#2e5e8c", note: "AC, fridge, electronics" },
        { label: "Lighting & other", pct: 15, color: "#2f8f4e", note: "" },
      ],
    },
    compare: { title: "Annual heating cost & carbon, typical CA home", rows: [
      { label: "Gas furnace", value: "more CO₂", pct: 100, color: "#8a857a" },
      { label: "Heat pump (today's grid)", value: "~45% less", pct: 45, color: "#2f8f4e" },
      { label: "Heat pump (2045 clean grid)", value: "~near zero", pct: 8, color: "#1f7a3d" },
    ] },
    sections: [
      { h: "Why buildings matter", body: "About a quarter of California's greenhouse-gas emissions come from buildings — overwhelmingly from burning fossil (natural) gas on-site for space heating, water heating, and cooking. Unlike the grid, which is steadily cleaning up on its own, a gas furnace emits the same carbon on its last day as its first. Decarbonizing buildings means swapping that on-site combustion for efficient electric equipment.", deep: "There's also an indoor-air-quality and health dimension: gas stoves and furnaces emit nitrogen oxides and, from stoves, benzene inside the home. And there's a 'lock-in' problem — heating equipment lasts 15–20 years, so every gas unit installed today largely determines emissions into the 2040s. That's why so much policy targets the replacement moment: making sure that when an old furnace or water heater dies, the electric option is available, affordable, and the default." },
      { h: "The heat pump", body: "A heat pump is the key technology. Instead of creating heat by burning fuel, it moves existing heat from outside to inside (and reverses in summer to cool). Because it moves heat rather than making it, a heat pump delivers 3–4 units of heat per unit of electricity — an effective efficiency of 300–400%, versus ~85–95% for even a good gas furnace. The same physics powers heat-pump water heaters.", deep: "The efficiency figure is called the Coefficient of Performance (COP): a COP of 3.5 means 3.5 kWh of heat per 1 kWh of electricity. Modern cold-climate heat pumps hold high COPs well below freezing, which matters less in most of California than in the Northeast. The catch is operating cost: because California electricity is expensive per unit relative to gas, the efficiency advantage doesn't always translate into a lower bill on today's rates — which is exactly what the calculator in the Tools tab lets you test." },
      { h: "The policy stack", body: "No single agency 'owns' building decarbonization — it's a stack. The CEC writes Title 24 building codes that increasingly favor electric and set the 2025/2028 cycles toward heat-pump baselines. CARB adopted zero-NOx rules that effectively phase out new gas furnaces and water heaters after 2030. The CPUC runs the ratepayer-funded incentive programs (like TECH Clean California) and sets the electric rates that determine whether switching saves money. The Legislature funds equity programs so low-income households aren't left on a shrinking, more expensive gas system." },
      { h: "The gas-transition problem", body: "As customers leave gas, the cost of maintaining the gas pipe network is spread over fewer users — risking a 'utility death spiral' where rising gas rates push more people off, raising rates further. Managing this equitably (so the last customers on gas aren't disproportionately low-income) is one of the hardest open questions, and a live issue in CPUC proceedings on the future of gas." },
    ],
    keyPoints: ["~24% of CA emissions; mostly on-site gas.", "Heat pumps move heat: 300–400% efficient.", "CEC codes + CARB zero-NOx + CPUC rates & incentives.", "The gas-transition 'death spiral' is the hard part."],
    ask: ["Why can a heat pump be over 300% efficient?", "What are CARB's zero-NOx appliance rules?", "What is the gas utility 'death spiral' and how is the CPUC handling it?"],
  },
  {
    id: "rates", icon: "🧾", title: "Your Electric Bill & Rates",
    summary: "What you actually pay for, why California rates are high, and how time-of-use and fixed charges change the math of electrification.",
    kicker: "§ 08 · Rates",
    stats: [{ num: "3", lbl: "cost buckets on a bill" }, { num: "TOU", lbl: "time-of-use pricing" }, { num: "IOU", lbl: "rates set by the CPUC" }],
    pullquote: "A kilowatt-hour at 6pm and one at noon are the same energy — and very different prices.",
    breakdown: {
      title: "What's inside a typical IOU electric rate",
      note: "Only part of your bill is the actual energy — most is the poles, wires, and public-program costs bundled into the rate.",
      items: [
        { label: "Generation (the energy)", pct: 38, color: "#2f8f4e", note: "power itself" },
        { label: "Transmission & distribution", pct: 42, color: "#2e5e8c", note: "poles, wires, upkeep" },
        { label: "Wildfire, public programs, fees", pct: 20, color: "#c0392b", note: "bundled into rates" },
      ],
    },
    sections: [
      { h: "What you're paying for", body: "An electric bill isn't just energy. It bundles generation (the electricity itself), transmission and distribution (the poles, wires, substations, and their upkeep — including, in California, large wildfire-mitigation costs), and public-purpose programs (efficiency, low-income discounts like CARE, and DER incentives). For CPUC-regulated IOUs, all of these are set through rate proceedings — which is why 'rate design' is where a lot of energy policy actually bites.", deep: "The total revenue a utility is allowed to collect — its 'revenue requirement' — is set in a General Rate Case (GRC) roughly every four years. Rate design then decides how to split that requirement across customers and hours. Two levers dominate the debate: volumetric rates (per-kWh charges, which reward using less but make electrification more expensive) versus fixed charges (a flat monthly amount, which lowers per-kWh prices but weakens the conservation signal). California's controversial income-graduated fixed charge grew out of exactly this tension." },
      { h: "Time-of-use", body: "Most California customers are now on Time-of-Use (TOU) rates: electricity costs more during the expensive evening 'peak' (typically ~4–9pm, when solar fades and demand is high) and less midday and overnight. TOU is the price signal behind demand flexibility — it's meant to nudge EV charging, laundry, and pre-cooling into cheaper, cleaner hours, and it's why a battery that shifts solar into the evening peak is so valuable.", deep: "The evening peak exists because of the 'duck curve': midday solar drives net demand down, then as the sun sets solar drops off just as people come home and turn things on, forcing a steep, expensive ramp from gas plants. TOU pricing tries to reshape demand to flatten that ramp. Dynamic and real-time rates go further, changing prices hour-to-hour based on actual grid conditions — the frontier of rate design and a live topic in CPUC dockets." },
      { h: "Why California rates are high", body: "California has some of the highest electricity rates in the country, driven less by the cost of energy itself than by transmission-and-distribution investment, wildfire mitigation and liability, and the many public programs funded through rates. High per-kWh prices are the central obstacle to electrification: a heat pump or EV is far more efficient, but if each kilowatt-hour is expensive, the bill savings shrink. This is the tension the fixed-charge debate is trying to resolve.", deep: "It's also why the agencies interact so tightly here: CARB and the CEC push electrification of cars and buildings, but whether that actually saves households money depends on CPUC rate design. If electrification loads (EVs, heat pumps) are placed on well-designed off-peak rates, they can even lower everyone's rates by spreading fixed grid costs over more kWh — the 'load growth' argument. Poorly designed, they just raise bills. That's why rate design is quietly one of the most consequential levers in the whole decarbonization project." },
    ],
    keyPoints: ["Bill = generation + wires + public programs.", "IOU rates are set by the CPUC in rate cases.", "TOU makes evening peak expensive — the demand-flexibility signal.", "High per-kWh rates are the main barrier to electrification."],
    ask: ["Why are California electricity rates so high?", "How do time-of-use rates work and when is peak?", "What is the income-graduated fixed charge debate?"],
  },
];

// California governance / agency org tree — a top-down structure of who sits where.
export const ORG_TREE = {
  top: { nt: "State of California", ns: "Constitution & voters" },
  branches: [
    {
      nt: "Legislative", ns: "writes the statutes",
      children: [{ nt: "Assembly", ns: "80 members" }, { nt: "Senate", ns: "40 members" }],
    },
    {
      nt: "Executive", ns: "Governor + agencies",
      umbrellas: [
        { nt: "CalEPA", ns: "environment & climate", agencies: [
          { name: "CARB", star: true, note: "air & climate" }, { name: "State Water Boards" }, { name: "CalRecycle" }, { name: "DTSC" }, { name: "OEHHA" },
        ] },
        { nt: "CNRA", ns: "natural resources", agencies: [
          { name: "CEC", star: true, note: "energy standards & planning" }, { name: "Coastal Commission" }, { name: "Dept. of Water Resources" }, { name: "Fish & Wildlife" },
        ] },
      ],
    },
    { nt: "Judicial", ns: "interprets the law", children: [{ nt: "Supreme Court" }, { nt: "Courts of Appeal" }] },
  ],
  independent: { nt: "CPUC", ns: "California Public Utilities Commission", note: "Constitutionally independent — regulates investor-owned utilities' rates and programs. NOT under the Governor's super-agencies. Reviewed directly by the appellate courts." },
};

// Interactive flow diagrams — rendered as clickable steppers.
export const DIAGRAMS = {
  cpucFlow: {
    title: "CPUC proceeding lifecycle",
    subtitle: "How a rulemaking moves from opening to a final, appealable decision.",
    steps: [
      { label: "OIR opens", desc: "An Order Instituting Rulemaking opens the docket (e.g., R.25-04-010) and lays out the scope and questions." },
      { label: "Scoping", desc: "The Assigned Commissioner and ALJ issue a Scoping Memo setting the issues, schedule, and category (quasi-legislative, ratesetting, or adjudicatory). A Prehearing Conference is held." },
      { label: "Record built", desc: "Parties file comments and testimony; workshops are held; ALJs issue rulings that pose questions and set comment deadlines. This is where most engagement happens." },
      { label: "Proposed Decision", desc: "The ALJ issues a Proposed Decision (PD). A Commissioner may offer an Alternate (APD). Parties get ~30 days to file opening and reply comments on it." },
      { label: "Commission vote", desc: "Commissioners vote on the PD/APD at a public Voting Meeting. An adopted PD becomes a Decision (D.)." },
      { label: "Rehearing / review", desc: "Parties may file Applications for Rehearing; final decisions can be challenged by writ in the Court of Appeal or Supreme Court." },
    ],
  },
  billFlow: {
    title: "How a California bill becomes law",
    subtitle: "The path through both houses to the Governor.",
    steps: [
      { label: "Introduced", desc: "A member introduces the bill in its house of origin (Assembly or Senate)." },
      { label: "Policy committee", desc: "Heard and voted in one or more policy committees (e.g., Utilities & Energy). It can be amended or held (killed)." },
      { label: "Appropriations", desc: "If it has a fiscal impact, it goes to the Appropriations committee — a common place for bills to stall on the 'suspense file.'" },
      { label: "Floor vote", desc: "The full house votes. If it passes, it crosses to the second house and repeats the whole committee-and-floor process." },
      { label: "Concurrence", desc: "If the second house amended it, the origin house must concur in the changes." },
      { label: "Governor", desc: "Sign, veto, or allow to become law without signature. Signed bills are 'chaptered' and become law." },
    ],
  },
  govTree: {
    title: "Where energy & climate power sits",
    subtitle: "The Governor's umbrellas plus the independent CPUC.",
    steps: [
      { label: "Legislature", desc: "Writes the statutes (bills) that direct every agency below. Two houses: Assembly (80) and Senate (40)." },
      { label: "CalEPA → CARB", desc: "The California EPA houses the Air Resources Board (climate, cap-and-trade, LCFS, vehicle & appliance emissions) and the water boards." },
      { label: "CNRA → CEC", desc: "The Natural Resources Agency houses the Energy Commission (building/appliance standards, planning, siting)." },
      { label: "CPUC (independent)", desc: "Constitutionally independent — regulates the investor-owned utilities' rates and programs. Not under CalEPA or CNRA." },
    ],
  },
  agencyMap: {
    title: "Who regulates what",
    subtitle: "Quick disambiguation across the energy & climate landscape.",
    steps: [
      { label: "CPUC", desc: "Utility rates, IOU programs, DER/net-billing compensation, procurement (IRP), resource adequacy, demand flexibility." },
      { label: "CEC", desc: "Building efficiency (Title 24), appliance standards (Title 20), energy forecasting/planning (IEPR), power-plant siting." },
      { label: "CARB", desc: "GHG targets & Scoping Plan, cap-and-trade, Low Carbon Fuel Standard, ZEV rules, zero-NOx appliances, climate disclosure." },
      { label: "Legislature", desc: "Passes the statutes (e.g., SB/AB bills) that create and direct all of the above programs." },
    ],
  },
};

export const GLOSSARY = [
  { term: "IOU", def: "Investor-Owned Utility — a for-profit utility regulated by the CPUC (PG&E, SCE, SDG&E, SoCalGas)." },
  { term: "POU", def: "Publicly-Owned Utility — a municipal utility (e.g., LADWP, SMUD), governed locally, not by the CPUC." },
  { term: "CCA", def: "Community Choice Aggregator — a local government that buys electricity for its residents while the IOU still delivers it (e.g., MCE, CleanPowerSF)." },
  { term: "DER", def: "Distributed Energy Resource — small, customer-side resources: rooftop solar, batteries, EV chargers, demand response." },
  { term: "VPP", def: "Virtual Power Plant — many DERs aggregated and dispatched together like a single power plant." },
  { term: "NEM / Net Billing", def: "Rules for compensating customer-generated (usually solar) electricity exported to the grid; 'net billing' is the successor to net energy metering." },
  { term: "RA", def: "Resource Adequacy — the requirement that utilities secure enough capacity to keep the grid reliable." },
  { term: "IRP", def: "Integrated Resource Plan — long-term CPUC planning for what resources the system will procure." },
  { term: "GRC", def: "General Rate Case — the proceeding where a utility sets its overall revenue requirement (what it can collect from ratepayers)." },
  { term: "OIR / OII", def: "Order Instituting Rulemaking / Investigation — the orders that open a CPUC proceeding." },
  { term: "ALJ", def: "Administrative Law Judge — runs a CPUC proceeding and drafts the Proposed Decision." },
  { term: "PD / APD", def: "Proposed Decision / Alternate Proposed Decision — the draft ruling parties comment on before the Commission votes." },
  { term: "IEPR", def: "Integrated Energy Policy Report — the CEC's biennial energy assessment and policy roadmap." },
  { term: "Title 24 / Title 20", def: "California's building energy standards (Title 24, Part 6) and appliance efficiency standards (Title 20)." },
  { term: "Scoping Plan", def: "CARB's roadmap for meeting the state's greenhouse-gas reduction targets." },
  { term: "Cap-and-Trade", def: "A market program that caps total GHG emissions and lets entities trade allowances." },
  { term: "LCFS", def: "Low Carbon Fuel Standard — CARB program to reduce the carbon intensity of transportation fuels." },
  { term: "RPS", def: "Renewables Portfolio Standard — the requirement that utilities supply a rising share of renewable electricity." },
  { term: "Building decarbonization", def: "Shifting buildings off fossil gas to efficient electric equipment (heat pumps for space/water heating) and grid readiness." },
  { term: "Demand flexibility", def: "Shifting or reducing electricity use in response to grid needs or prices, often via dynamic rates." },
  { term: "Ex parte", def: "A private communication with a decisionmaker; restricted and must be reported in CPUC proceedings." },
  { term: "Chaptered", def: "A bill signed into law and assigned a chapter number." },
  { term: "CAISO", def: "California Independent System Operator — runs the state's transmission grid and wholesale electricity market." },
  { term: "Heat pump", def: "Electric device that moves heat rather than making it, so it delivers 3–4× more heat per unit of energy than a gas furnace; reverses to cool in summer." },
  { term: "COP", def: "Coefficient of Performance — heat delivered per unit of electricity used; a COP of 3.5 means 3.5 kWh of heat per 1 kWh of power." },
  { term: "TOU", def: "Time-of-Use rate — electricity priced higher during the evening peak (~4–9pm) and lower midday/overnight to shift demand." },
  { term: "Duck curve", def: "The daily net-demand shape: midday solar pushes demand down, then a steep evening ramp as solar fades and people come home." },
  { term: "Revenue requirement", def: "The total amount a utility is allowed to collect from ratepayers, set in a General Rate Case; rate design splits it across customers and hours." },
  { term: "Zero-NOx", def: "CARB rules effectively phasing out new gas furnaces and water heaters (which emit nitrogen oxides) in favor of electric appliances after 2030." },
  { term: "Fixed charge", def: "A flat monthly amount on an electric bill (vs. per-kWh volumetric charges); central to the debate over making electrification affordable." },
];
