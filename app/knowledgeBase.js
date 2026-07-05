// Curated California regulatory & governance knowledge base. This grounds the
// Intelligence assistant (RAG-style) so answers are consistent and authoritative,
// not just the model's loose recall. Reference material — verify specifics
// (current officeholders, exact dates, current rule text) against primary sources.
export const KNOWLEDGE_BASE = `
CALIFORNIA GOVERNANCE — STRUCTURE
- Three branches: Legislative (bicameral: 80-member Assembly, 40-member Senate), Executive (Governor plus constitutional officers and agencies), Judicial.
- The Governor oversees executive "super-agencies" that house departments/boards. The two most relevant to energy & climate:
  - California Environmental Protection Agency (CalEPA): houses the Air Resources Board (CARB), State Water Resources Control Board, CalRecycle, DTSC, OEHHA, DPR.
  - California Natural Resources Agency (CNRA): houses the California Energy Commission (CEC), Coastal Commission, Dept. of Water Resources, and others.
- The California Public Utilities Commission (CPUC) is an INDEPENDENT agency established by the California Constitution (Article XII). It is NOT under CalEPA or CNRA and is only loosely subject to gubernatorial/legislative control; it has quasi-legislative and quasi-judicial authority.
- Rulemaking by most executive agencies follows the California Administrative Procedure Act (APA), overseen by the Office of Administrative Law (OAL): notice, public comment (min. 45 days), hearing, adoption, OAL review for necessity/authority/clarity. The CPUC largely operates under its own Public Utilities Code process instead of the APA.

CPUC (California Public Utilities Commission)
- Role: regulates investor-owned utilities (IOUs) — electricity & gas (Pacific Gas & Electric / PG&E, Southern California Edison / SCE, San Diego Gas & Electric / SDG&E, Southern California Gas / SoCalGas), plus telecom, water, and some transportation.
- Structure: 5 Commissioners appointed by the Governor to staggered 6-year terms, confirmed by the Senate. Supported by staff Divisions (e.g., Energy Division) and Administrative Law Judges (ALJs). The Public Advocates Office (Cal Advocates) is an independent ratepayer advocate within the CPUC.
- Proceeding types and docket prefixes:
  - Rulemaking (R.) — opened by an Order Instituting Rulemaking (OIR); the main vehicle for policy (e.g., energy efficiency, demand flexibility, building decarbonization).
  - Investigation (I.) — opened by an Order Instituting Investigation (OII).
  - Application (A.) — a utility requests authority (e.g., a General Rate Case / GRC).
  - Complaint (C.).
  - Docket format example: R.25-04-010 = Rulemaking opened in 2025, 4th month, sequence 010.
- Typical rulemaking lifecycle:
  1. OIR opens the proceeding and states scope/questions.
  2. Assigned Commissioner + assigned ALJ issue a Scoping Memo (issues, schedule, category: quasi-legislative vs adjudicatory vs ratesetting).
  3. Parties file to participate; a Prehearing Conference (PHC) is held.
  4. Record development: party comments, testimony, workshops, ALJ rulings (which often set comment schedules and pose questions).
  5. A Proposed Decision (PD) is issued by the ALJ (or a Presiding Officer's Decision); an Alternate Proposed Decision (APD) may be issued by a Commissioner.
  6. Parties get ~30 days to file opening and reply comments on the PD/APD.
  7. The Commission votes at a public Voting Meeting; an adopted PD becomes a Decision (D.), e.g., D.25-06-019.
  8. Parties may file Applications for Rehearing (Afr); final decisions may be challenged by writ in the Court of Appeal / CA Supreme Court.
- Ex parte communications (private contacts with decisionmakers) are restricted and must be reported, especially in ratesetting proceedings.
- Key energy topic areas: energy efficiency "rolling portfolios," General Rate Cases, Integrated Resource Planning (IRP) & procurement, Net Energy Metering / Net Billing (successor tariff), Self-Generation Incentive Program (SGIP), Demand Response / demand flexibility & dynamic rates, Resource Adequacy (RA), building decarbonization (gas transition, electrification, line extensions).

CEC (California Energy Commission)
- Role: the state's primary energy policy and planning agency (within CNRA). 5 Commissioners appointed by the Governor.
- Core functions:
  - Building Energy Efficiency Standards — Title 24, Part 6 of the CA Code of Regulations, updated on roughly a 3-year cycle (e.g., 2022, 2025, 2028 code cycles).
  - Appliance Efficiency Standards — Title 20.
  - Load Management Standards (encouraging shifting demand, e.g., to real-time or dynamic rates).
  - Integrated Energy Policy Report (IEPR) — biennial assessment/forecast of energy trends and policy.
  - Power plant licensing: historically for thermal plants ≥50 MW; under AB 205, an opt-in certification path exists for large renewable and storage projects.
  - Funding/incentive programs (e.g., BUILD program for building decarbonization; EPIC R&D).
- CEC and CPUC often coordinate (e.g., on building decarbonization and demand flexibility) but have distinct authorities: CEC sets standards and does planning; CPUC regulates the IOUs and rates.

CARB (California Air Resources Board)
- Role: air quality and climate change (within CalEPA). A 16-member board. Works with 35 regional/local air districts (e.g., South Coast AQMD / SCAQMD, Bay Area AQMD).
- Major programs/authorities:
  - Climate: AB 32 (Global Warming Solutions Act, 2006) and SB 32 set GHG targets; the Scoping Plan is CARB's roadmap. Cap-and-Trade program. Low Carbon Fuel Standard (LCFS).
  - Vehicles: Advanced Clean Cars, Advanced Clean Trucks, Advanced Clean Fleets (ZEV mandates).
  - Buildings/appliances: zero-NOx / zero-emission standards for space and water heaters (relevant to building decarbonization).
  - Corporate climate disclosure: SB 253 (GHG emissions reporting) and SB 261 (climate-related financial risk).
- Rulemaking: follows the CA APA (45-day notice, comment, board hearing, adoption, OAL review). Board items get a public comment docket.

CALIFORNIA LEGISLATURE — BILL PROCESS
- Two-year session (e.g., 2025–2026). Bills carry over between the two years (a "two-year bill").
- Path: Introduction → policy committee(s) in house of origin → Appropriations committee if fiscal → floor vote in house of origin → repeat in the second house → concurrence in amendments → to the Governor.
- Governor options: sign, veto, or allow to become law without signature. A signed bill is "chaptered" (assigned a chapter number) and becomes law.
- Key deadlines each year (roughly): bill introduction deadline (Feb), house-of-origin passage deadline (late May/early June), and end-of-session (Aug/Sep). Bills that miss deadlines are effectively dead.
- Committees relevant to energy: Assembly Utilities & Energy, Senate Energy, Utilities & Communications; Natural Resources; Appropriations.
- LegiScan status codes used in this tracker: 1 = Introduced, 2 = Engrossed (passed a house / in process), 3 = Enrolled (sent to Governor), 4 = Passed/Chaptered, 5 = Vetoed, 6 = Failed/Dead.

KEY TERMS / GLOSSARY
- IOU: Investor-Owned Utility (e.g., PG&E, SCE, SDG&E, SoCalGas). POU: Publicly-Owned Utility (municipal, e.g., LADWP, SMUD). CCA: Community Choice Aggregator (local government electricity procurement, e.g., MCE, CleanPowerSF).
- DER: Distributed Energy Resources (rooftop solar, storage, EV chargers, demand response). VPP: Virtual Power Plant (aggregated DERs).
- NEM / Net Billing: compensation for customer-generated (usually solar) exports.
- RA: Resource Adequacy (utilities must show enough capacity for reliability). IRP: Integrated Resource Plan (long-term planning). GRC: General Rate Case (utility revenue requirement).
- ALJ: Administrative Law Judge. OIR/OII: Order Instituting Rulemaking/Investigation. PD/APD: Proposed / Alternate Proposed Decision. IEPR: Integrated Energy Policy Report. LCFS: Low Carbon Fuel Standard. ZEV: Zero-Emission Vehicle. GHG: Greenhouse Gas.
- Building decarbonization: shifting buildings off fossil gas to electric (heat pumps for space/water heating), efficiency, and grid readiness. Demand flexibility: shifting/reducing electricity use in response to grid needs/prices.

WHO DOES WHAT (quick disambiguation)
- Utility rates, IOU programs, DER compensation, procurement, RA -> CPUC.
- Building/appliance efficiency standards, energy forecasting/planning, power-plant siting -> CEC.
- GHG/climate targets, cap-and-trade, LCFS, vehicle standards, air-quality & appliance emissions rules, climate disclosure -> CARB (with local air districts on local rules).
- Statutes that direct all of the above -> California Legislature (then implemented by the agencies).
`;
