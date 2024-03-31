
const hardcodedCats = [
    { id: 1, name: "SofiaBack", age: 2, weight: 2.3 },
    { id: 2, name: "RaymondBack", age: 5, weight: 3.8 },
];

const startCatRepository = () => {
    let allCats = JSON.parse(JSON.stringify(hardcodedCats));
    const setAllInternal = (newCats) => { allCats = newCats; };

    const errorCat = { id: -1, name: "Error", age: -1, weight: -1 };

    const getAllCats = () => allCats;

    const getCatById = (id) => {
        const cat = allCats.find(cat => cat.id === id);
        if (cat !== undefined)
            return cat;
        return errorCat;
    }

    const addCat = ({ name, age, weight }) => {
        let maximumId = 0;
        allCats.forEach(cat => {
            if (cat.id > maximumId)
                maximumId = cat.id;
        });

        let newCat = {id: maximumId + 1, name: name, age: age, weight: weight};

        setAllInternal([...allCats, newCat]);
    }

    const deleteCat = (id) => {
        setAllInternal(allCats.filter(cat => cat.id !== id));
    }

    const updateCat = (id, newCat) => {
        setAllInternal(allCats.map(currentCat => {
            if (currentCat.id === id)
                return newCat;
            return currentCat;
        }));
    }

    // const setAll = (newCats) => {
    //     setAllInternal([...newCats]);
    // }

    return { getAllCats, getCatById, addCat, deleteCat, updateCat };
}

module.exports = {startCatRepository};