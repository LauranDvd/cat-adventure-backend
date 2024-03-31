var express = require('express');
const { startCatRepository } = require('../repository/CatRepository');
var router = express.Router();

const pageSize = 5;

const { getAllCats, getCount, getCatById, addCat, deleteCat, updateCat } = startCatRepository();

router.get('/', (req, res, next) => {
  res.send('cats route...');
});

router.get('/count', (req, res, next) => {
  res.json({ count: getCount() });
})

router.get('/all', (req, res, next) => {
  let allCats = JSON.parse(JSON.stringify(getAllCats()));

  let sortByNameDirection = req.query.sortByNameDirection;
  let pageNumber = req.query.page;
  // console.log("req: " + req.query.sortByNameDirection);

  if (sortByNameDirection === "asc")
    allCats.sort((a, b) => a.name < b.name ? -1 : 1);
  else
    allCats.sort((a, b) => a.name > b.name ? -1 : 1);

  if (pageNumber > 0)
    allCats = allCats.slice(pageSize * (pageNumber - 1), pageSize * pageNumber);

  res.json(allCats);
});

router.route("/get-by-id/:id").get((req, res) => {
  let givenId = req.params.id;

  if (Number.isNaN(parseInt(givenId))) {
    return res.status(400).json({ error: `Please provide an integer for the id` });
  }

  const cat = getCatById(parseInt(givenId));

  if (cat.id === -1) {
    return res.status(404).json({ error: `No cat with id ${givenId}` });
  }

  console.log(cat);
  res.json(cat);
});

router.post("/add", (req, res, next) => {
  let givenCat = req.body;
  console.log(givenCat);

  // TODO separate method for the validation
  if (!givenCat.hasOwnProperty("name") || !givenCat.hasOwnProperty("age") || !givenCat.hasOwnProperty("weight")) {
    return res.status(400).json({ error: `Cat doesn't contain all the fields it should contain` });
  }
  if (Object.keys(givenCat).length !== 3) {
    return res.status(400).json({ error: `Cat contains too many fields (note: don't give the ID)` });
  }
  // TODO check we have ints where we should have ints

  addCat(givenCat);

  return res.json({ message: "Successfully added the cat" });
});

router.route("/update/:id").put((req, res) => {
  let givenId = parseInt(req.params.id);
  const givenCat = req.body;

  if (Number.isNaN(givenId)) {
    return res.status(400).json({ error: `Please provide an integer for the id` });
  }

  if (!givenCat.hasOwnProperty("name") || !givenCat.hasOwnProperty("age") || !givenCat.hasOwnProperty("weight")) {
    return res.status(400).json({ error: `Cat doesn't contain all the fields it should contain` });
  }
  if (Object.keys(givenCat).length !== 3) {
    return res.status(400).json({ error: `Cat contains too many fields (note: don't give the ID)` });
  }

  if (getCatById(givenId).id === -1) {
    return res.status(404).json({ error: `No cat with id ${givenId}` });
  }

  updateCat(givenId, { id: givenId, name: givenCat.name, age: givenCat.age, weight: givenCat.weight });

  return res.json({ message: "Successfully updated the cat" });
});

router.route("/delete/:id").delete((req, res) => {
  let givenId = parseInt(req.params.id);

  if (Number.isNaN(parseInt(givenId))) {
    return res.status(404).json({ error: `Please provide an integer for the id` });
  }

  if (getCatById(givenId).id === -1) {
    return res.status(404).json({ error: `No cat with id ${givenId}` });
  }

  deleteCat(givenId);

  return res.json({ message: "Successfully deleted the cat" });
});

// TODO validations in all requests

module.exports = router;
