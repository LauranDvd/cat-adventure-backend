var express = require('express');
const { startCatService } = require('../service/CatService');
const checkJwt = require('../TokenCheck');
var router = express.Router();
var jwt = require('jsonwebtoken');
const fs = require('fs');


const { getAllCatsSortedAndPaginated, getCatCount, getCatById, addCat, updateCat, deleteCat, getToysPerCat, getUsersFavoriteBreed } =
  startCatService();

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

  let successful = await updateCat(givenId, { id: givenId, name: givenCat.name, age: givenCat.age, weight: givenCat.weight });

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

  if (deleteCat(givenId) === true)
    return res.status(200).json({ message: "Successfully deleted the cat" });
  else
    return res.status(400).json({ message: "Cannot delete the cat" });
});

router.route("/users-favorite-breed/:id").get(async (req, res) => {
  let givenId = req.params.id;

  let authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ error: 'Authorization header is missing' });
  }
  let token = authHeader.split(' ')[1];

  console.log('token: ' + token);

  var certificate = fs.readFileSync('routes/key.pem');  // get public key

  jwt.verify(token, certificate, { algorithms: ['RS256'] }, async function (err, decoded) {
    console.log('error: ' + err);
    console.log('decoded: ' + JSON.stringify(decoded));

    if (decoded === undefined || decoded.sub !== "auth0|" + givenId) {
      console.log('bad token...');

      return res.status(401).json({ error: `Bad token!!` });
    } else {
      const breed = await getUsersFavoriteBreed(givenId);

      if (breed === "") {
        return res.status(404).json({ error: `User doesnt exist or have favorite breed` });
      }

      res.status(200).json(breed);
    }
  });
})

router.route("/toys_per_cat").get(async (req, res) => {
  let count = req.query.count;

  const result = await getToysPerCat(count);
  res.status(200).json(result);
});

module.exports = router;
