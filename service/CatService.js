const { startCatRepository } = require('../repository/CatRepository');
const { OpenAI } = require("openai");
const { ERROR_CAT } = require('../utils/Constants');

const openai = new OpenAI();

const pageSize = 5;
const AVATAR_JSON_KEYS_AND_MAXIMUM = [["body", 15], ["fur", 10], ["eyes", 15], ["mouth", 9], ["accessory", 17]];
const DEFAULT_AVATAR_PARAMETERS_STRING = `{"body": 1, "fur": 1, "eyes": 1, "mouth": 1, "accessory": 20}`;
const OPENAI_MODEL = "gpt-3.5-turbo";

const getJsonKeysCount = (jsonObject) => {
    return Object.keys(jsonObject).length;
}

const avatarJsonContainsRequiredKeys = (jsonObject) => {
    for (const oneKeyAndMaximum of AVATAR_JSON_KEYS_AND_MAXIMUM) {
        const oneKey = oneKeyAndMaximum[0];

        if (!jsonObject.hasOwnProperty(oneKey))
            return false;
    }
    return true;
}

const avatarJsonHasNumbersTooBig = (jsonObject) => {
    for (const oneKeyAndMaximum of AVATAR_JSON_KEYS_AND_MAXIMUM) {
        const key = oneKeyAndMaximum[0];
        const maximum = oneKeyAndMaximum[1];

        if (jsonObject[key] > maximum) {
            console.log(`object ${jsonObject} has key ${key} too big: it is ${jsonObject[key]}, max is ${maximum}`)

            return true;
        }
    }
    return false;
}

const areAvatarParametersValid = (avatarParametersString) => {
    try {
        const avatarParametersObject = JSON.parse(avatarParametersString);

        if (getJsonKeysCount(avatarParametersObject) != AVATAR_JSON_KEYS_AND_MAXIMUM.length)
            return false;
        if (!avatarJsonContainsRequiredKeys(avatarParametersObject))
            return false;
        if (avatarJsonHasNumbersTooBig(avatarParametersObject))
            return false;
        return true;
    }
    catch (e) {
        return false;
    }
}

const startCatService = () => {
    const { getAll, getCount, getById, add, deleteById, update, toysPerCat, getUsersFavoriteBreedById, getAllSortedPaginated,
        getAgeDistribution, getUsersCatsById, buy, setTheAvatar, getCutestCatOfUser
    } =
        startCatRepository(true);

    const getAllCatsSortedAndPaginated = async (sortByNameDirection, pageNumber) => {
        console.log("will get cats: " + sortByNameDirection + pageNumber);
        if (pageNumber === "0" || pageNumber === 0) {
            return getAll();
        }

        let allCats = await getAllSortedPaginated(
            sortByNameDirection === "asc" ? 1 : -1,
            pageSize * (pageNumber - 1) + 1,
            pageSize * pageNumber
        );

        console.log('service: returning ' + allCats);

        return allCats;
    };

    const getCatCount = () => {
        return getCount();
    }

    const getCatById = async (id) => {
        if (Number.isNaN(parseInt(id)))
            return ERROR_CAT;

        return await getById(parseInt(id));
    }

    const addCat = ({ name, age, weight, cuteness, ownerId }) => {
        if (Number.isNaN(parseInt(age)) || Number.isNaN(parseInt(weight)))
            return false;

        add({ name, age, weight, cuteness, ownerId });
        return true;
    }

    const updateCat = async (id, newCat) => {
        console.log('service updatecat: ' + JSON.stringify(newCat));
        if (Number.isNaN(parseInt(newCat.weight)) || Number.isNaN(parseInt(newCat.age)))
            return false;
        // if (parseInt(newCat.weight) < 0 || parseInt(newCat.age < 0))
        //     return false;

        await update(id, newCat);
        return true;
    }

    const deleteCat = async (id) => {
        return await deleteById(id);
    }

    const getUsersFavoriteBreed = async (userId) => {
        return await getUsersFavoriteBreedById(userId);
    }

    const getToysPerCat = (count) => {
        return toysPerCat(count);
    }

    const getCatAgeDistribution = async () => {
        return await getAgeDistribution();
    }

    const getMyCats = async (userId) => {
        return await getUsersCatsById(userId);
    }

    const buyCatById = async (catId, userId) => {
        return await buy(catId, userId);
    }

    const setAvatar = async (catId, userPrompt) => {
        console.log(`catservice: entered setavatar`);

        const chatGptPrompt = createGenerateAvatarOpenAiPrompt(userPrompt);

        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: chatGptPrompt }],
            model: OPENAI_MODEL
        });

        let avatarParameters = completion.choices[0].message.content;

        console.log(`service setavatar - generated params, not stringified: ${avatarParameters}`);
        console.log(`service setavatar - generated params, stringified: ${JSON.stringify(avatarParameters)}`);

        if (!areAvatarParametersValid(avatarParameters)) {
            avatarParameters = DEFAULT_AVATAR_PARAMETERS_STRING;
        }

        return await setTheAvatar(catId, avatarParameters);
    }

    const createGenerateAvatarOpenAiPrompt = (userPrompt) => {
        return `I have a site called CatAdventure, where users buy cats and play with them. Users can set their cats' avatars, by inputting a prompt, which I send to you. What you have to do is to decide, based on their prompt, how the cat's avatar's body, fur, eyes, mouth, and accessory should look like.
            Hence, first I will give you the different types of body, fur, eyes, mouth, and accessory. Then, I will give you the user's prompt.
            You will have to give me one number for each part (body, fur, eyes, mouth, and accessory). Write it as a JSON, for example: {"body": 3, "fur": 2, "eyes": 8, "mouth": 4, "accessory": 5}. Only send the JSON, do not send anything else. Include quotation marks around the keys. 

            Body types:
            1: bright orange
            2: creamy white
            3: dark orange
            4: dark grey
            5: muddy orange
            6: yellow
            7: light blue
            8: brown
            9: pink and girly
            11: red
            12: light purple
            13: dark gray, almost black
            14: green
            15: brick color

            Fur:
            1: some lines on the fur
            2: some lines on the fur
            3: no marks on the fur
            4: fur has circle-like marks
            5: cat has a black patch on its eye
            6: cat has a white patch on its eye
            7: almost no marks on the fur
            8: cat has a white patch on its nose
            9: cat has square patches on its fur
            10: cat has a lot of little circle patches

            Eyes:
            1: big, round
            2: big, more wide than tall
            3: very small
            4: big, more tall than wide
            5: with a monocle
            6: square
            7: closed and happy
            8: round, medium-to-big-sized
            9: round, medium-sized
            10: green
            11: girly, with a lot of make-up
            12: round and relatively small
            13: with square eyeglasses
            14: very tall
            15: girly, a little bit of make-up

            Mouth:
            1: open, happy
            2: closed, satisfied
            3: open, surprised
            4: wide open, excited
            5: 80% open, happy
            6: 60% open, happy
            7: closed, satisfied
            9: smiling, you can see its teeth

            Accessory:
            1: red scarf
            2: collar with key
            3: laptop/phone
            4: collar without key
            5: head band
            6: cute bow tie on its head
            7: black elegant hat
            8: black headphones and ipad
            9: blue scarf
            11: typewriter
            12: collar with diamonds
            13: black head band
            15: red elegant hat
            16: silver headphones
            17: none

            The user's prompt: "${userPrompt}"`;
    }

    const getMyCutest = async (userId) => {
        return await getCutestCatOfUser(userId);
    }

    return {
        getAllCatsSortedAndPaginated, getCatCount, getCatById, addCat, updateCat, deleteCat, getToysPerCat, getUsersFavoriteBreed,
        getCatAgeDistribution, getMyCats, buyCatById, setAvatar, getMyCutest
    };
}

module.exports = { startCatService };