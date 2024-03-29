/* eslint-disable func-names */

// This file was generated by generate_arpa_table_migrations.js on 2022-08-22T07:02:02.209Z.
// Describe any manual modifications below:
//  - (none)

exports.up = function (knex) {
    return knex.schema.raw(
        // This SQL generated with the following command:
        // pg_dump postgresql://localhost:5432/usdr_arpa_reporter --schema-only --no-owner --no-privileges --table=uploads
        `
            --
            -- PostgreSQL database dump
            --
            
            -- Dumped from database version 14.2
            -- Dumped by pg_dump version 14.2
            
            SET statement_timeout = 0;
            SET lock_timeout = 0;
            SET idle_in_transaction_session_timeout = 0;
            SET client_encoding = 'UTF8';
            SET standard_conforming_strings = on;
            -- Line below commented out by generate_arpa_table_migrations.js because it interferes with Knex
            -- SELECT pg_catalog.set_config('search_path', '', false);
            SET check_function_bodies = false;
            SET xmloption = content;
            SET client_min_messages = warning;
            SET row_security = off;
            
            SET default_tablespace = '';
            
            SET default_table_access_method = heap;
            
            --
            -- Name: uploads; Type: TABLE; Schema: public; Owner: -
            --
            
            CREATE TABLE public.uploads (
                filename text NOT NULL,
                created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
                reporting_period_id integer,
                user_id integer,
                agency_id integer,
                validated_at timestamp with time zone,
                validated_by integer,
                ec_code character varying(255),
                tenant_id integer NOT NULL,
                id uuid DEFAULT gen_random_uuid() NOT NULL
            );
            
            
            --
            -- Name: uploads uploads_pkey; Type: CONSTRAINT; Schema: public; Owner: -
            --
            
            ALTER TABLE ONLY public.uploads
                ADD CONSTRAINT uploads_pkey PRIMARY KEY (id);
            
            
            --
            -- Name: uploads uploads_agency_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
            --
            
            ALTER TABLE ONLY public.uploads
                ADD CONSTRAINT uploads_agency_id_foreign FOREIGN KEY (agency_id) REFERENCES public.agencies(id);
            
            
            --
            -- Name: uploads uploads_reporting_period_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
            --
            
            ALTER TABLE ONLY public.uploads
                ADD CONSTRAINT uploads_reporting_period_id_foreign FOREIGN KEY (reporting_period_id) REFERENCES public.reporting_periods(id);
            
            
            --
            -- Name: uploads uploads_user_id_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
            --
            
            ALTER TABLE ONLY public.uploads
                ADD CONSTRAINT uploads_user_id_foreign FOREIGN KEY (user_id) REFERENCES public.users(id);
            
            
            --
            -- Name: uploads uploads_validated_by_foreign; Type: FK CONSTRAINT; Schema: public; Owner: -
            --
            
            ALTER TABLE ONLY public.uploads
                ADD CONSTRAINT uploads_validated_by_foreign FOREIGN KEY (validated_by) REFERENCES public.users(id);
            
            
            --
            -- PostgreSQL database dump complete
            --
        `,
    );
};

exports.down = function (knex) {
    return knex.schema.dropTable('uploads');
};
