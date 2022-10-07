const express = require('express');

const router = express.Router();
const knex = require('../db/connection');

router.get('/', async (req, res) => {
    // if DB call fails, this will throw and health route will 500
    const dbResult = await knex
        .raw('SELECT \'OK\' AS ok')
        .timeout(500, { cancel: true });

    res.json({ success: true, db: dbResult.rows[0].ok });
});

module.exports = router;
