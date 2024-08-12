var express = require('express');
const { startCatService } = require('../service/CatService');
var router = express.Router();
var jwt = require('jsonwebtoken');
const fs = require('fs');
const { checkTokenThenDoStuff, checkManagerOrAdminTokenThenDoStuff } = require('../auth/TokenCheck');
const { OpenAI } = require("openai");

const openai = new OpenAI();

const { getAllCatsSortedAndPaginated, getCatCount, getCatById, addCat, updateCat, deleteCat, getToysPerCat, getUsersFavoriteBreed,
  getCatAgeDistribution, getMyCats, buyCatById, setAvatar, getMyCutest } = startCatService();

const validateCat = (cat) => {
  if (!cat.hasOwnProperty("name") || !cat.hasOwnProperty("age") || !cat.hasOwnProperty("weight"))
    return false;
  if (cat.name.length == 0)
    return false;
  if (Number.isNaN(parseInt(cat.age)) || Number.isNaN(parseInt(cat.weight)))
    return false;
  if (parseInt(cat.age) < 0 || parseInt(cat.weight) < 0)
    return false;

  return true;
}

router.get('/count', async (req, res, next) => {
  res.status(200).json({ count: await getCatCount() });
})

router.get('/', async (req, res, next) => {
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

router.post("/", async (req, res) => {
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

router.route("/:id").put(async (req, res) => {
  checkManagerOrAdminTokenThenDoStuff(req, res, async function (decoded) {
    let givenId = parseInt(req.params.id);
    const givenCat = req.body;

    if (!validateCat(givenCat))
      return res.status(400).json({ error: `Cat has an invalid form` });

    const currentCat = await getCatById(givenId);
    if (currentCat.id === -1) {
      return res.status(404).json({ error: `No cat with id ${givenId}` });
    }
    console.log(`in updateById, getById returned: ${JSON.stringify(currentCat)}`);

    let successful = await updateCat(
      givenId,
      {
        id: givenId, name: givenCat.name, age: givenCat.age, weight: givenCat.weight,
        cuteness: currentCat.cuteness, ownerId: currentCat.ownerId
      }
    );

    if (successful)
      return res.json({ message: "Successfully updated the cat" });
    else
      return res.status(400).json({ error: `Cat is not valid` });
  });
});

router.route("/:id").delete(async (req, res) => {
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
});

router.route("/mine").get(async (req, res) => {
  return checkTokenThenDoStuff(req, res, async function (decoded) {
    let userId = decoded.sub.substring(6, decoded.sub.length);

    const myCats = await getMyCats(userId);
    console.log('mine passed token check! mycats=' + JSON.stringify(myCats));

    if (myCats === undefined)
      return res.status(400);
    return res.status(200).json(myCats);
  })
})

router.route("/toys_per_cat").get(async (req, res) => {
  let count = req.query.count;

  const result = await getToysPerCat(count);
  res.status(200).json(result);
});


router.get('/age-distribution', async (req, res, next) => {
  const result = await getCatAgeDistribution();
  console.log('api result: ' + JSON.stringify(result));
  res.status(200).json(result);
});

router.post("/buy", async (req, res) => {
  checkTokenThenDoStuff(req, res, function (decoded) {
    let catId = req.body.catId;
    let userId = decoded.sub.substring(6, decoded.sub.length);

    if (buyCatById(catId, userId))
      return res.json({ message: "Successfully bought the cat" });
    else
      return res.status(400).json({ error: `Could not buy the cat` });
  });
});

router.route("/update-cuteness/:id").put(async (req, res) => {
  let catId = parseInt(req.params.id);
  const newCuteness = req.body.newCuteness;

  const cat = await getCatById(catId);
  if (cat.id === -1) {
    return res.status(404).json({ error: `No cat with id ${catId}` });
  }

  let successful = await updateCat(
    catId,
    { id: catId, name: cat.name, age: cat.age, weight: cat.weight, cuteness: newCuteness, ownerId: cat.ownerId }
  );
  console.log('update cuteness successful: ' + successful);

  // return res.status(200);

  if (successful)
    return res.json({ message: "Successfully updated the cat" });
  else
    return res.status(400).json({ error: `Cat is not valid` });
});

router.route("/quiz-questions").post(async (req, res) => {
  const prompt = `Generate a quiz about cats with 10 multiple-choice questions.\n
  Write it as a JSON array. Send the JSON directly, don't write anything else. Each question has 3 fields:\n
  a. "question": the question itself\n
  b. "options": list with the options\n
  c. "answer": the correct option (should be one of the options)\n
  The form should be something like this, but with 10 questions, not 2:\n
  [
    { question: "The first question", options: ["option 1", "option 2", "option 3"], answer: "option 2" },
    { question: "The second question", options: ["option 2.1", "option 2.2", "option 2.3"], answer: "option 2.3" }
]`;

  // return res.status(200).json([]);
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: prompt }],
    model: "gpt-3.5-turbo",
  });

  const responseQuiz = completion.choices[0].message.content;

  console.log('some completion: ' + responseQuiz);
  return res.status(200).json(JSON.parse(responseQuiz));
});

router.route("/set-avatar").post(async (req, res) => {
  checkTokenThenDoStuff(req, res, async function (decoded) {
    console.log(`catsapi setavatar`);

    const catId = req.body.catId;
    const prompt = req.body.prompt;
    let userId = decoded.sub.substring(6, decoded.sub.length);

    const cat = await getCatById(catId);
    if (cat.id === -1) {
      return res.status(404).json({ error: `No cat with id ${catId}` });
    }
    if (cat.ownerId !== userId) {
      return res.status(401).json({ error: `Not your cat` });
    }

    let successful = await setAvatar(
      catId,
      prompt
    );

    if (successful)
      return res.json({ message: "Successfully set avatar" });
    else
      return res.status(400).json({ error: `Couldnt set avatar` });
  });
});

router.route("/my-cutest").get(async (req, res) => {
  console.log('my cutest will do token check!');
  return checkTokenThenDoStuff(req, res, async function (decoded) {
    let userId = decoded.sub.substring(6, decoded.sub.length);

    const myCutest = await getMyCutest(userId);
    console.log('my cutest passed token check! my cutest=' + JSON.stringify(myCutest));

    if (myCutest === undefined)
      return res.status(400);
    return res.status(200).json(myCutest);
  })
})

module.exports = router;
