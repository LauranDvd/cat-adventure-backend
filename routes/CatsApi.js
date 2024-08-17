var express = require('express');
const { startCatService } = require('../service/CatService');
var router = express.Router();
const { checkTokenThenExecute, checkManagerOrAdminTokenThenExecute } = require('../auth/TokenCheck');
const { OpenAI } = require("openai");

const openai = new OpenAI();

const { getAllCatsSortedAndPaginated, getCatCount, getCatById, addCat, updateCat, deleteCat, getToysPerCat, getUsersFavoriteBreed,
  getCatAgeDistribution, getMyCats, buyCatById, setAvatar, getMyCutest } = startCatService();

const ERROR_CAT_ID = -1;
const AUTH0_USER_ID_PREFIX_LENGTH = 6;
const GENERATE_QUIZ_OPENAI_PROMPT = `Generate a quiz about cats with 10 multiple-choice questions.\n
  Write it as a JSON array. Send the JSON directly, don't write anything else. Each question has 3 fields:\n
  a. "question": the question itself\n
  b. "options": list with the options\n
  c. "answer": the correct option (should be one of the options)\n
  The form should be something like this, but with 10 questions, not 2:\n
  [
    { question: "The first question", options: ["option 1", "option 2", "option 3"], answer: "option 2" },
    { question: "The second question", options: ["option 2.1", "option 2.2", "option 2.3"], answer: "option 2.3" }
]`;
const OPENAI_MODEL = "gpt-3.5-turbo";

const validateCat = (cat) => {
  if (!catHasTheRequiredProperties(cat))
    return false;
  if (cat.name.length == 0)
    return false;
  if (Number.isNaN(parseInt(cat.age)) || Number.isNaN(parseInt(cat.weight)))
    return false;
  if (parseInt(cat.age) < 0 || parseInt(cat.weight) < 0)
    return false;

  return true;
}

const catHasTheRequiredProperties = (cat) => {
  return cat.hasOwnProperty("name") && cat.hasOwnProperty("age") && cat.hasOwnProperty("weight");
}

router.get('/count', async (_req, res, _next) => {
  res.status(200).json({ count: await getCatCount() });
})

router.get('/', async (req, res, _next) => {
  let sortByNameDirection = req.query.sortByNameDirection;
  let pageNumber = req.query.page;

  const result = await getAllCatsSortedAndPaginated(sortByNameDirection, pageNumber);
  console.log('api get / result: ' + JSON.stringify(result));
  res.status(200).json(result);
});

router.route("/get-by-id/:id").get(async (req, res) => {
  let givenId = req.params.id;

  const cat = await getCatById(givenId);

  if (cat.id === ERROR_CAT_ID) {
    return res.status(404).json({ error: `No cat with id ${givenId}` });
  }

  res.status(200).json(cat);
});

router.post("/", async (req, res) => {
  checkManagerOrAdminTokenThenExecute(req, res, function (_decoded) {
    let givenCat = req.body;

    if (!validateCat(givenCat))
      return res.status(400).json({ error: `Cat has an invalid form` });

    if (addCat(givenCat)) {
      return res.json({ message: "Successfully added the cat" });
    }
    else {
      return res.status(400).json({ error: `Cat is not valid` });
    }
  });
});

router.route("/:id").put(async (req, res) => {
  checkManagerOrAdminTokenThenExecute(req, res, async function (_decoded) {
    let givenId = parseInt(req.params.id);
    const givenCat = req.body;

    if (!validateCat(givenCat)) {
      return res.status(400).json({ error: `Cat has an invalid form` });
    }
    const currentCat = await getCatById(givenId);
    if (currentCat.id === ERROR_CAT_ID) {
      return res.status(404).json({ error: `No cat with id ${givenId}` });
    }
    console.log(`in update, get returned: ${JSON.stringify(currentCat)}`);

    let successful = await updateCat(
      givenId,
      {
        id: givenId, name: givenCat.name, age: givenCat.age, weight: givenCat.weight,
        cuteness: currentCat.cuteness, ownerId: currentCat.ownerId
      }
    );

    if (successful) {
      return res.json({ message: "Successfully updated the cat" });
    }
    else {
      return res.status(400).json({ error: `Cat is not valid` });
    }
  });
});

router.route("/:id").delete(async (req, res) => {
  checkManagerOrAdminTokenThenExecute(req, res, async function (_decoded) {
    let givenId = parseInt(req.params.id);

    if (getCatById(givenId).id === ERROR_CAT_ID) {
      return res.status(404).json({ error: `No cat with id ${givenId}` });
    }

    if (await deleteCat(givenId)) {
      return res.status(200).json({ message: "Successfully deleted the cat" });
    }
    else {
      return res.status(400).json({ message: "Cannot delete the cat" });
    }
  });
});

router.route("/users-favorite-breed").get(async (req, res) => {
  checkTokenThenExecute(req, res, async function (decoded) {
    let userId = decoded.sub.substring(AUTH0_USER_ID_PREFIX_LENGTH, decoded.sub.length);

    const breed = await getUsersFavoriteBreed(userId);

    if (breed === "") {
      return res.status(404).json({ error: `User does not exist or have favorite breed` });
    }

    res.status(200).json(breed);
  });
});

router.route("/mine").get(async (req, res) => {
  return checkTokenThenExecute(req, res, async function (decoded) {
    let userId = decoded.sub.substring(AUTH0_USER_ID_PREFIX_LENGTH, decoded.sub.length);

    const myCats = await getMyCats(userId);
    console.log('api - my cats: ' + JSON.stringify(myCats));

    if (myCats === undefined) {
      return res.status(400);
    }
    return res.status(200).json(myCats);
  })
});

router.route("/toys_per_cat").get(async (req, res) => {
  let count = req.query.count;

  const toysPerCat = await getToysPerCat(count);
  res.status(200).json(toysPerCat);
});

router.get('/age-distribution', async (_req, res, _next) => {
  const ageDistribution = await getCatAgeDistribution();
  console.log('api age distribution: ' + JSON.stringify(ageDistribution));
  res.status(200).json(ageDistribution);
});

router.post("/buy", async (req, res) => {
  checkTokenThenExecute(req, res, function (decoded) {
    let catId = req.body.catId;
    let userId = decoded.sub.substring(AUTH0_USER_ID_PREFIX_LENGTH, decoded.sub.length);

    if (buyCatById(catId, userId)) {
      return res.json({ message: "Successfully bought the cat" });
    }
    else {
      return res.status(400).json({ error: `Could not buy the cat` });
    }
  });
});

router.route("/update-cuteness/:id").put(async (req, res) => {
  let catId = parseInt(req.params.id);
  const newCuteness = req.body.newCuteness;

  const cat = await getCatById(catId);
  if (cat.id === ERROR_CAT_ID) {
    return res.status(404).json({ error: `No cat with id ${catId}` });
  }

  let wasSuccessful = await updateCat(
    catId,
    { id: catId, name: cat.name, age: cat.age, weight: cat.weight, cuteness: newCuteness, ownerId: cat.ownerId }
  );
  console.log('update cuteness successfulness: ' + wasSuccessful);

  if (wasSuccessful) {
    return res.json({ message: "Successfully updated the cat" });
  }
  else {
    return res.status(400).json({ error: `Cat is not valid` });
  }
});

router.route("/quiz-questions").post(async (_req, res) => {
  const completion = await openai.chat.completions.create({
    messages: [{ role: "system", content: GENERATE_QUIZ_OPENAI_PROMPT }],
    model: OPENAI_MODEL,
  });

  const responseQuiz = completion.choices[0].message.content;

  console.log('generated quiz: ' + responseQuiz);
  return res.status(200).json(JSON.parse(responseQuiz));
});

router.route("/set-avatar").post(async (req, res) => {
  checkTokenThenExecute(req, res, async function (decoded) {
    console.log(`entered api - set avatar`);

    const catId = req.body.catId;
    const prompt = req.body.prompt;
    let userId = decoded.sub.substring(AUTH0_USER_ID_PREFIX_LENGTH, decoded.sub.length);

    const cat = await getCatById(catId);
    if (cat.id === ERROR_CAT_ID) {
      return res.status(404).json({ error: `No cat with id ${catId}` });
    }
    if (cat.ownerId !== userId) {
      return res.status(401).json({ error: `Not your cat` });
    }

    let wasSuccessful = await setAvatar(catId, prompt);

    if (wasSuccessful) {
      return res.json({ message: "Successfully set avatar" });
    }
    else {
      return res.status(400).json({ error: `Couldnt set avatar` });
    }
  });
});

router.route("/my-cutest").get(async (req, res) => {
  return checkTokenThenExecute(req, res, async function (decoded) {
    let userId = decoded.sub.substring(AUTH0_USER_ID_PREFIX_LENGTH, decoded.sub.length);

    const myCutest = await getMyCutest(userId);
    console.log('api - my cutest: ' + JSON.stringify(myCutest));

    if (myCutest === undefined) {
      return res.status(400);
    }
    return res.status(200).json(myCutest);
  })
});

module.exports = router;
