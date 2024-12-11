const express = require('express');

const router = express.Router();
const knex = require('../db/connection');

router.get('/', async (req, res) => {
    const logger = req.log.child({ ip: req.ip, healthcheck: true });
    logger.debug('starting healthcheck');
    let success = false;
    try {
        // if DB call fails, this will throw and health route will 500
        const dbHealth = await knex
            .raw(`SELECT 'ok' AS healthcheck_result`)
            .timeout(1000, { cancel: true });
        success = true;
        logger.debug(
            { success, db_result: dbHealth.rows[0] },
            'received healthcheck result from database',
        );
    } catch (err) {
        logger.error({ success: false, err }, 'healthcheck failed');
        throw err;
    }
    res.json({ success });
});

module.exports = router;
