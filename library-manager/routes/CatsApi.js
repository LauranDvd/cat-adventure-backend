var express = require('express');
const { startCatService } = require('../service/CatService');
var router = express.Router();

const connectToDatabase = require("../database/DBConnection");

const { getAllCatsSortedAndPaginated, getCatCount, getCatById, addCat, updateCat, deleteCat } = startCatService();

const validateCat = (cat) => {
  if (!cat.hasOwnProperty("name") || !cat.hasOwnProperty("age") || !cat.hasOwnProperty("weight"))
    return false;
  if (Object.keys(cat).length !== 3)
    return false;
  if (cat.name.length == 0)
    return false;
  return true;
}

router.get('/', async (req, res, next) => {
  const db = await connectToDatabase();
  let collection = await db.collection("Cats");
  let results = await collection.find({})
    .limit(50)
    .toArray();
  res.send(results).status(200);
});

router.get('/count', (req, res, next) => {
  res.json({ count: getCatCount() });
})

router.get('/all', (req, res, next) => {
  let sortByNameDirection = req.query.sortByNameDirection;
  let pageNumber = req.query.page;

  res.json(getAllCatsSortedAndPaginated(sortByNameDirection, pageNumber));
});

router.route("/get-by-id/:id").get((req, res) => {
  let givenId = req.params.id;

  const cat = getCatById(givenId);

  if (cat.id === -1) {
    return res.status(404).json({ error: `No cat with id ${givenId}` });
  }

  res.json(cat);
});

router.post("/add", async (req, res, next) => {
  let givenCat = req.body;

  if (!validateCat(givenCat))
    return res.status(400).json({ error: `Cat has an invalid form` });

  if (addCat(givenCat))
    return res.json({ message: "Successfully added the cat" });
  else
    return res.status(400).json({ error: `Cat is not valid` });
});

router.route("/update/:id").put((req, res) => {
  let givenId = parseInt(req.params.id);
  const givenCat = req.body;

  if (!validateCat(givenCat))
    return res.status(400).json({ error: `Cat has an invalid form` });

  if (getCatById(givenId).id === -1) {
    return res.status(404).json({ error: `No cat with id ${givenId}` });
  }

  if (updateCat(givenId, { id: givenId, name: givenCat.name, age: givenCat.age, weight: givenCat.weight }))
    return res.json({ message: "Successfully updated the cat" });
  else
    return res.status(400).json({ error: `Cat is not valid` });
});

router.route("/delete/:id").delete((req, res) => {
  let givenId = parseInt(req.params.id);

  if (getCatById(givenId).id === -1) {
    return res.status(404).json({ error: `No cat with id ${givenId}` });
  }

  deleteCat(givenId);

  return res.json({ message: "Successfully deleted the cat" });
});

module.exports = router;
