
const hardcodedCats = [
    { id: 1, name: "Sofia", age: 2, weight: 2.3 },
    { id: 2, name: "Raymond", age: 5, weight: 3.8 },
    { id: 3, name: "David", age: 3, weight: 2.3 },
    { id: 4, name: "Mihai", age: 4, weight: 1.8 },
    { id: 5, name: "Ion", age: 1, weight: 2.3 },
    { id: 6, name: "Ionel", age: 1, weight: 1.8 },
    { id: 7, name: "Felicia", age: 5, weight: 5.3 },
    { id: 8, name: "Cami", age: 6, weight: 3.3 },
    { id: 9, name: "Popescu", age: 3, weight: 2.4 },
    { id: 10, name: "Georgescu", age: 3, weight: 6.3 },
    { id: 11, name: "Xyz", age: 12, weight: 2.1 },
    { id: 12, name: "Alina", age: 10, weight: 4.9 },
];

const errorCat = { id: -1, name: "Error", age: -1, weight: -1 };

const startCatRepository = () => {
    let allCats = JSON.parse(JSON.stringify(hardcodedCats));

    const getAll = () => allCats;

    const getCount = () => allCats.length;

    const getById = (id) => {
        const cat = allCats.find(cat => cat.id === id);
        if (cat !== undefined)
            return cat;
        return errorCat;
    }

    const add = ({ name, age, weight }) => {
        let maximumId = 0;
        allCats.forEach(cat => {
            if (cat.id > maximumId)
                maximumId = cat.id;
        });

        let newCat = {id: maximumId + 1, name: name, age: age, weight: weight};

        allCats = [...allCats, newCat];
    }

    const deleteById = (id) => {
        allCats = allCats.filter(cat => cat.id !== id);
    }

    const update = (id, newCat) => {
        allCats = allCats.map(currentCat => {
            if (currentCat.id === id)
                return newCat;
            return currentCat;
        });
    }

    return { getAll, getCount, getById, add, deleteById, update };
}

module.exports = {startCatRepository, errorCat};