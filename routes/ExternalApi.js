var express = require('express');
var router = express.Router();

router.post('/paypal-return', async (req, res) => {
    console.log('reached paypal return endpoint');
});


module.exports = router;
