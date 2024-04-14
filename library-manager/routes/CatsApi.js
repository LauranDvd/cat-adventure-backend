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
  res.send([]).status(200);
});

router.get('/count', async (req, res, next) => {
  res.status(200).json({ count: await getCatCount() });
})

router.get('/all', async (req, res, next) => {
  let sortByNameDirection = req.query.sortByNameDirection;
  let pageNumber = req.query.page;

  const result = await getAllCatsSortedAndPaginated(sortByNameDirection, pageNumber);
  console.log('api result: ' + JSON.stringify(result));
  res.status(200).json(result);
});

router.route("/get-by-id/:id").get(async (req, res) => {
  let givenId = req.params.id;

  const cat = await getCatById(givenId);

  if (cat.id === -1) {
    return res.status(404).json({ error: `No cat with id ${givenId}` });
  }

  res.status(200).json(cat);
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

router.route("/update/:id").put(async (req, res) => {
  let givenId = parseInt(req.params.id);
  const givenCat = req.body;

  if (!validateCat(givenCat))
    return res.status(400).json({ error: `Cat has an invalid form` });

  if (getCatById(givenId).id === -1) {
    return res.status(404).json({ error: `No cat with id ${givenId}` });
  }

  let successful = await updateCat(givenId, { id: givenId, name: givenCat.name, age: givenCat.age, weight: givenCat.weight});

  if (successful)
    return res.json({ message: "Successfully updated the cat" });
  else
    return res.status(400).json({ error: `Cat is not valid` });
});

router.route("/delete/:id").delete(async (req, res) => {
  let givenId = parseInt(req.params.id);

  if (getCatById(givenId).id === -1) {
    return res.status(404).json({ error: `No cat with id ${givenId}` });
  }

  deleteCat(givenId);

  return res.status(200).json({ message: "Successfully deleted the cat" });
});

module.exports = router;
