const { faker } = require('@faker-js/faker');

const getRandomName = () => {
    return faker.vehicle.bicycle();
}

const getRandomCatId = () => {
    return 1 + Math.floor(Math.random() * 12);
}

const errorToy = { id: -1, name: "Error", catId: -1 };

const addRandomToys = (addFunction, numberOfToys) => {
    for (let i = 0; i < numberOfToys; i++)
        addFunction({ name: getRandomName(), catId: getRandomCatId() });
}

const startToyRepository = () => {
    let allToys = [];

    const getAll = () => allToys;

    const getCount = () => allToys.length;

    const getById = (id) => {
        const toy = allToys.find(toy => toy.id === id);
        if (toy !== undefined)
            return toy;
        return errorToy;
    }

    const add = ({ name, catId }) => {
        let maximumId = 0;
        allToys.forEach(toy => {
            if (toy.id > maximumId)
                maximumId = toy.id;
        });

        let newToy = { id: maximumId + 1, name: name, catId: catId };

        allToys = [...allToys, newToy];
    }

    const deleteById = (id) => {
        allToys = allToys.filter(toy => toy.id !== id);
    }

    const update = (id, newToy) => {
        allToys = allToys.map(currentToy => {
            if (currentToy.id === id)
                return newToy;
            return currentToy;
        });
    }

    addRandomToys(add, 30);

    return { getAll, getCount, getById, add, deleteById, update };
}

module.exports = { startToyRepository, errorToy };