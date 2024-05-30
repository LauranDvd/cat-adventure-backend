var express = require('express');
const { startCatService } = require('../service/CatService');
var router = express.Router();
var jwt = require('jsonwebtoken');
const fs = require('fs');
const { checkTokenThenDoStuff, checkManagerOrAdminTokenThenDoStuff } = require('../auth/TokenCheck');


const { getAllCatsSortedAndPaginated, getCatCount, getCatById, addCat, updateCat, deleteCat, getToysPerCat, getUsersFavoriteBreed } =
  startCatService();

const validateCat = (cat) => {
  if (!cat.hasOwnProperty("name") || !cat.hasOwnProperty("age") || !cat.hasOwnProperty("weight"))
    return false;
  if (Object.keys(cat).length !== 3)
    return false;
  if (cat.name.length == 0)
    return false;
  if (Number.isNaN(parseInt(cat.age)) || Number.isNaN(parseInt(cat.weight)))
    return false;
  if (parseInt(cat.age) < 0 || parseInt(cat.weight) < 0)
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

router.post("/add", async (req, res) => {
  checkManagerOrAdminTokenThenDoStuff(req, res, function (decoded) {
    let givenCat = req.body;

    if (!validateCat(givenCat))
      return res.status(400).json({ error: `Cat has an invalid form` });

    if (addCat(givenCat))
      return res.json({ message: "Successfully added the cat" });
    else
      return res.status(400).json({ error: `Cat is not valid` });
  });
});

router.route("/update/:id").put(async (req, res) => {
  checkManagerOrAdminTokenThenDoStuff(req, res, async function (decoded) {
    let givenId = parseInt(req.params.id);
    const givenCat = req.body;

    if (!validateCat(givenCat))
      return res.status(400).json({ error: `Cat has an invalid form` });

    if (getCatById(givenId).id === -1) {
      return res.status(404).json({ error: `No cat with id ${givenId}` });
    }

    let successful = await updateCat(givenId, { id: givenId, name: givenCat.name, age: givenCat.age, weight: givenCat.weight });

    if (successful)
      return res.json({ message: "Successfully updated the cat" });
    else
      return res.status(400).json({ error: `Cat is not valid` });
  });
});

router.route("/delete/:id").delete(async (req, res) => {
  checkManagerOrAdminTokenThenDoStuff(req, res, async function (decoded) {
    let givenId = parseInt(req.params.id);

    if (getCatById(givenId).id === -1) {
      return res.status(404).json({ error: `No cat with id ${givenId}` });
    }

    if (await deleteCat(givenId) === true)
      return res.status(200).json({ message: "Successfully deleted the cat" });
    else
      return res.status(400).json({ message: "Cannot delete the cat" });
  });
});

router.route("/users-favorite-breed").get(async (req, res) => {
  checkTokenThenDoStuff(req, res, async function (decoded) {
    let userId = decoded.sub.substring(6, decoded.sub.length);

    const breed = await getUsersFavoriteBreed(userId);

    if (breed === "") {
      return res.status(404).json({ error: `User doesnt exist or have favorite breed` });
    }

    res.status(200).json(breed);
  });
})

router.route("/toys_per_cat").get(async (req, res) => {
  let count = req.query.count;

  const result = await getToysPerCat(count);
  res.status(200).json(result);
});

module.exports = router;
