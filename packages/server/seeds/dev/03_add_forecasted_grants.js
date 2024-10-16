// require('dotenv').config();

const {
    forecastedGrants, assignedForecastedGrantsAgency,
} = require('./ref/forecastedGrants');

const seed = async (knex) => {
    await knex('grants').insert(forecastedGrants);
    await knex('assigned_grants_agency').insert(assignedForecastedGrantsAgency);
};

module.exports = {
    seed,
};
