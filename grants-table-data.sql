--
-- PostgreSQL database dump
--

-- Dumped from database version 14.4
-- Dumped by pg_dump version 14.4

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: grants; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.grants (grant_id, grant_number, title, status, agency_code, cost_sharing, cfda_list, reviewer_name, opportunity_category, search_terms, notes, created_at, updated_at, description, eligibility_codes, raw_body, opportunity_status, revision_id, funding_instrument_codes, bill, award_ceiling, award_floor, open_date, close_date, archive_date) FROM stdin;
335255	21-605	EAR Postdoctoral Fellowships	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p class="MsoNormal">The Division of Earth Sciences (EAR) awards Postdoctoral Fellowships </p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-11	2021-11-03	\N
333816	HHS-2021-IHS-TPI-0001	Community Health Aide Program:  Tribal Planning & Implementation	inbox	HHS-IHS	No	93.382	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-06 23:03:53.57025+00	2021-08-11 19:35:42.562+00	 <p>Health Aide Program for Covid</p>	11 07 25	raw body	posted	\N	\N	\N	500000	\N	2021-08-05	2021-09-06	\N
666999	grant-number-666999	Test Grant 666999	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666999</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-09-04	2023-11-03	\N
0	0	Test Grant 0	inbox	HHS-IHS	No	93.382	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-06 23:03:53.57025+00	2021-08-11 19:35:42.562+00			raw body	posted	\N	\N	\N	500000	\N	2021-08-05	2023-11-04	\N
333333	HHS-2021-IHS-TPI-0002	Community Health Aide Program:  County Planning & Implementation	inbox	HHS-IHS	No	93.382	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-06 23:03:53.57025+00	2021-08-11 19:35:42.562+00	 <p>Health Aide Program for Covid</p>	11 07 25	raw body	posted	\N	\N	\N	500000	\N	2021-08-05	2023-11-05	\N
666666	grant-number-666666	Test Grant 666666	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666666</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-11	2023-11-07	\N
666656	grant-number-666656	Test Grant 666656	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666656</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-12	2023-11-06	\N
666646	grant-number-666646	Test Grant 666646	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666646</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-13	2021-11-01	\N
666636	grant-number-666636	Test Grant 666636	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666636</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-14	2023-11-07	\N
666626	grant-number-666626	Test Grant 666626	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666626</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-15	2021-10-30	\N
666616	grant-number-666616	Test Grant 666616	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666616</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-16	2021-10-29	\N
666606	grant-number-666606	Test Grant 666606	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666606</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-17	2021-10-28	\N
666596	grant-number-666596	Test Grant 666596	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666596</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-18	2021-10-27	\N
666586	grant-number-666586	Test Grant 666586	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666586</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-19	2021-10-26	\N
666576	grant-number-666576	Test Grant 666576	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666576</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-20	2021-10-25	\N
666566	grant-number-666566	Test Grant 666566	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666566</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-21	2021-10-24	\N
666556	grant-number-666556	Test Grant 666556	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666556</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-22	2021-10-23	\N
666546	grant-number-666546	Test Grant 666546	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666546</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-23	2021-10-22	\N
666536	grant-number-666536	Test Grant 666536	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666536</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-24	2021-10-21	\N
666526	grant-number-666526	Test Grant 666526	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666526</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-25	2021-10-20	\N
666516	grant-number-666516	Test Grant 666516	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666516</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-26	2021-10-19	\N
666506	grant-number-666506	Test Grant 666506	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666506</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-27	2021-10-18	\N
666496	grant-number-666496	Test Grant 666496	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666496</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-28	2021-10-17	\N
666486	grant-number-666486	Test Grant 666486	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666486</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-29	2021-10-16	\N
666476	grant-number-666476	Test Grant 666476	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666476</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-30	2021-10-15	\N
666466	grant-number-666466	Test Grant 666466	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666466</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-08-31	2021-10-14	\N
666456	grant-number-666456	Test Grant 666456	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666456</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-09-01	2021-10-13	\N
666446	grant-number-666446	Test Grant 666446	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666446</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-09-02	2021-10-12	\N
666436	grant-number-666436	Test Grant 666436	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666436</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-09-03	2021-10-11	\N
666426	grant-number-666426	Test Grant 666426	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666426</p>	25	raw body	posted	\N	\N	\N	6500	\N	2021-09-04	2021-10-10	\N
666427	grant-number-666427	Test Grant 666427	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666427 - zero ceil</p>	25	raw body	posted	\N	\N	\N	0	\N	2021-09-04	2023-10-20	\N
666428	grant-number-666428	Test Grant 666428	inbox	NSF	No	47.050	none	Discretionary	[in title/desc]+	auto-inserted by script	2021-08-11 18:30:38.89828+00	2021-08-11 19:30:39.531+00	<p>Test Grant Description 666428 - null ceil</p>	25	raw body	posted	\N	\N	\N	\N	\N	2021-09-04	2023-10-20	\N
\.


--
-- PostgreSQL database dump complete
--

