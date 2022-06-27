// These are all arrays due to a limitation of docx npm package
// It doesn't properly apply \n characters, instead you need to use a
// built-in property called 'break'. So each element of each array below will trigger a break
const EXECUTIVE_SUMMARY = [`In this section, provide a high-level overview of the jurisdiction’s
intended and actual uses of funding including, but not limited to:
the jurisdiction’s plan for use of funds to promote a response to
the pandemic and economic recovery, key outcome goals, progress to
date on those outcomes, and any noteworthy challenges or
opportunities identified during the reporting period.
`];

const USES_OF_FUNDS = [`Describe in further detail your jurisdiction’s intended and actual uses
of the funds, such as how your jurisdiction’s approach would help support
a strong and equitable recovery from the COVID-19 pandemic and
economic downturn. Describe any strategies employed to maximize
programmatic impact and effective, efficient, and equitable outcomes.
Given the broad eligible uses of funds and the specific needs
of the jurisdiction, explain how the funds would support the
communities, populations, or individuals in your jurisdiction.
Address how you are promoting each of the following
Expenditure Categories, to the extent they apply:
`,
'',
'Public Health (EC 1)',
'Negative Economic Impacts (EC 2)',
'Services to Disproportionately Impacted Communities (EC 3)',
'Premium Pay (EC 4)',
'Water, sewer, and broadband infrastructure (EC 5)',
'Revenue Replacement (EC 6)',
'',
`Where appropriate, include information on your jurisdiction’s use
(or planned use) of other federal recovery funds including other
programs under the American Rescue Plan such as Emergency Rental Assistance,
Housing Assistance, and so forth, to provide broader context on the overall
approach for pandemic recovery.
`];

const COMMUNITY_ENGAGEMENT = [`Describe how your jurisdiction’s planned or current use of funds
incorporates written, oral,
and other forms of input that capture diverse feedback from constituents, community-based
organizations, and the communities themselves. Where relevant, this description must include
how funds will build the capacity of community organizations to serve people with significant
barriers to services, including people of color, people with low incomes, limited English
proficiency populations, and other traditionally underserved groups. 
`];

const LABOR_PRACTICES = [`Describe workforce practices on any infrastructure projects being pursued
(EC 5). How are
projects using strong labor standards to promote effective and efficient delivery of
high-quality infrastructure projects while also supporting the economic recovery through
strong employment opportunities for workers? For example, report whether any of the following
practices are being utilized: project labor agreements, community benefits agreements,
prevailing wage requirements, and local hiring.
`];

const USE_OF_EVIDENCE = [`Identify whether SLFRF funds are being used for evidence-based
interventions and/or if projects
are being evaluated through rigorous program evaluations that are designed to build evidence.
Specifically, in this section, recipients should describe their overall approach for using
evidence and evaluation, including how a Learning Agenda (either narrowly focused on SLFRF or
broadly focused on the recipient’s broader policy agenda) could support their overarching
evaluation efforts in order to create an evidence-building strategy for their jurisdiction.
However, detailed evidence information for each project should be included in the Project
Inventory (see details in the Project Inventory section below).
`];

const PERFORMANCE_REPORT = [`For the Project Inventories in Section 8, include key performance
indicators for your
jurisdiction’s major SLFRF funded projects. Report key performance indicators for each project,
or group projects with substantially similar goals and the same outcome measures. Jurisdictions
may choose to include some indicators for each individual project as well as crosscutting
indicators. Include both output and outcome measures.  See Section C(9) on page 27 of the
Reporting Guidance for additional information.
In addition, you must include the mandatory performance indicators if your jurisdiction has
projects in the relevant areas (this information may be included in each recipient’s Recovery
Plan as they determine most appropriate). Provide data disaggregated by race, ethnicity, gender,
income, and other relevant factors, if possible.  Data should be presented in a table and each
annual report should include updated data for the performance period as well as prior period
data.
`,
'',
'a. Household Assistance (EC 2.2 & 2.5) and Housing Support (EC 3.10-3.12):',
`\tNumber of people or households receiving eviction prevention services
(including legal representation)`,
'\tNumber of affordable housing units preserved or developed',
'',
'b. Negative Economic Impacts (EC 2):',
'\tNumber of workers enrolled in sectoral job training programs',
'\tNumber of workers completing sectoral job training programs',
'\tNumber of people participating in summer youth employment programs',
'',
'c. Education Assistance (EC 3.1-3.5):',
'\tNumber of students participating in evidence-based tutoring programs',
'',
'd. Healthy Childhood Environments (EC 3.6-3.9):',
'\tNumber of children served by childcare and early learning (pre-school/pre-K/ages 3- 5)',
'\tNumber of families served by home visiting',
];

const PROJECT_OVERVIEW = [`A description of the project that includes an overview of the main activities
of the project, the
approximate timeline, primary delivery mechanisms and partners, if applicable,
and intended outcomes.  
`,
'',
'Link to the website of the project if available',
'',
'How project contributes to addressing climate change (for infrastructure projects under EC 5)',
];

const PROJECT_USE_OF_EVIDENCE = [`Briefly describe the goals of the project, and whether SLFRF funds are
being used for
evidence-based interventions, the evidence base for the interventions, and/or if projects
are being evaluated through rigorous program evaluations that are designed to build evidence.
If a recipient is conducting a program evaluation in lieu of reporting the amount of spending
on evidence-based interventions, they must describe the evaluation design (see Reporting Guidance
for additional details that should be included). 
`,
'',
`Identify the dollar amount of the total project spending that is allocated towards
evidence-based interventions for each project in the Public Health (EC 1), Negative
Economic Impacts (EC 2), and Services to Disproportionately Impacted Communities (EC 3)
Expenditure Categories.
`];

const PROMOTING_EQUITABLE_OUTCOMES = [`In this section, describe efforts to date and intended
outcomes to promote equity. Each annual report to follow must provide an update, using qualitative
and quantitative data, on how the recipients’ approach achieved or promoted equitable outcomes or
progressed against equity goals during the performance period. 
`,
`Describe efforts to promote equitable outcomes, including how programs were designed with equity
in mind. Include how your jurisdiction will consider and measure equity at the various stages of
the program, including: 
`,
'',
`\ta. Goals:  Are there particular historically underserved, marginalized, or adversely affected
groups that you intend to serve?`,
`\tb. Awareness: How equal and practical is the ability for residents or businesses to become
aware of the services funded by the SLFRF?`,
`\tc. Access and Distribution: Are there differences in levels of access to benefits and
services across groups? Are there administrative requirements that result in disparities in
ability to complete applications or meet eligibility criteria?`,
`\td. Outcomes: Are intended outcomes focused on closing gaps, reaching universal levels of
service, or disaggregating progress by race, ethnicity, and other equity dimensions where
relevant for the policy objective?`,
'',
`Describe how your jurisdiction’s planned or current use of funds prioritizes economic and
racial equity as a goal, names specific targets intended to produce meaningful
equity results at scale, and articulates the strategies to achieve those targets.
Explain how your jurisdiction’s overall equity strategy translates into the specific
services or programs offered by your jurisdiction in the following Expenditure Categories:`,
'',
`\ta. Negative Economic Impacts (EC 2): assistance to households, small businesses, and
non-profits to address impacts of the pandemic, which have been most severe among
low-income populations. This includes assistance with food, housing, and other needs;
employment programs for people with barriers to employment who faced negative economic
impacts from the pandemic (such as residents of low-income neighborhoods, minorities,
disconnected youth, the unemployed, formerly incarcerated people, veterans, and people
with disabilities); and other strategies that provide disadvantaged groups with access to
education, jobs, and opportunity.`,
`\tb. Services to Disproportionately Impacted Communities (EC 3): services to address health
disparities and the social determinants of health, build stronger neighborhoods and
communities (e.g., affordable housing), address educational disparities (e.g., evidence-based
tutoring, community schools, and academic, social-emotional, and mental health
supports for high poverty schools), and promote healthy childhood environments (e.g., home
visiting, child care).`,
'',
`Describe your jurisdiction’s efforts to date and intended outcomes to promote equity using
qualitative and quantitative data on how the jurisdiction’s approach achieved or
promoted equitable outcomes or progressed against equity goals. Describe any constraints or
challenges that impacted project success in terms of increasing equity.`,
'',
`Describe the geographic and demographic distribution of funding, including
whether it is targeted toward traditionally marginalized communities.`,
];

const TABLE_OF_EXPENSES = [`In this section, list the amount of funds used in each Expenditure
Category. The table should include cumulative expenses to date within each category,
and the additional amount spent within each category since the last annual Recovery Plan.`,
'',
`Jurisdictions may modify the table as needed by deleting unused rows where they have not
expended any funds or by adding columns to more clearly characterize their program expenditures
over time.`,
];

module.exports = {
    COMMUNITY_ENGAGEMENT,
    EXECUTIVE_SUMMARY,
    LABOR_PRACTICES,
    PERFORMANCE_REPORT,
    PROJECT_OVERVIEW,
    PROJECT_USE_OF_EVIDENCE,
    PROMOTING_EQUITABLE_OUTCOMES,
    TABLE_OF_EXPENSES,
    USES_OF_FUNDS,
    USE_OF_EVIDENCE,
};
