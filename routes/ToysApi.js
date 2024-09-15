var express = require('express');
const { startToyService } = require('../service/ToyService');
var router = express.Router();


const { getAllToys, getToyCount, getToyById, addToy, updateToy, deleteToy } = startToyService();

const toyJsonProperties = ["name", "catId"];
const ERROR_TOY_ID = -1;

const validateToy = (toy) => {
    if (!toyHasOnlyTheRequiredProperties(toy)) {
        return false;
    }
    if (toy.name.length == 0) {
        return false;
    }
    return true;
}

const toyHasOnlyTheRequiredProperties = (toy) => {
    return toyJsonProperties.every(property => toy.hasOwnProperty(property))
        && Object.keys(toy).length === toyJsonProperties.length;
}

router.get('/', (_req, res, _next) => {
    res.send('toys route...');
});

router.get('/count', async (_req, res, _next) => {
    console.log('api - entered count');
    let count = await getToyCount();
    console.log('api - obtained count');
    res.json({ count: count });
})

router.get('/all', async (_req, res, _next) => {
    res.json(await getAllToys());
});

router.route("/get-by-id/:id").get(async (req, res) => {
    let givenId = req.params.id;

    const toy = await getToyById(givenId);

    if (toy.id === ERROR_TOY_ID) {
        return res.status(404).json({ error: `No toy with id ${givenId}` });
    }

    res.json(toy);
});

router.post("/add", async (req, res, _next) => {
    let givenToy = req.body;

    if (!validateToy(givenToy)) {
        return res.status(400).json({ error: `Toy has an invalid form` });
    }

    if (addToy(givenToy)) {
        return res.json({ message: "Successfully added the toy" });
    }
    else {
        return res.status(400).json({ error: `Toy is not valid` });
    }
});

router.route("/update/:id").put(async (req, res) => {
    let givenId = parseInt(req.params.id);
    const givenToy = req.body;

    if (!validateToy(givenToy)) {
        return res.status(400).json({ error: `Toy has an invalid form` });
    }

    if (getToyById(givenId).id === ERROR_TOY_ID) {
        return res.status(404).json({ error: `No toy with id ${givenId}` });
    }

    let wasSuccessful = await updateToy(givenId, { id: givenId, name: givenToy.name, catId: givenToy.catId });

    if (wasSuccessful) {
        return res.json({ message: "Successfully updated the toy" });
    }
    else {
        return res.status(400).json({ error: `Toy is not valid` });
    }
});

router.route("/delete/:id").delete(async (req, res) => {
    let givenId = parseInt(req.params.id);

    if (getToyById(givenId).id === ERROR_TOY_ID) {
        return res.status(404).json({ error: `No toy with id ${givenId}` });
    }

    deleteToy(givenId);

    return res.json({ message: "Successfully deleted the toy" });
});

module.exports = router;
