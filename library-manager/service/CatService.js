const { startCatRepository, errorCat } = require('../repository/CatRepository');


const pageSize = 5;

const startCatService = () => {
    const { getAll, getCount, getById, add, deleteById, update } = startCatRepository();

    const getAllCatsSortedAndPaginated = (sortByNameDirection, pageNumber) => {
        let allCats = JSON.parse(JSON.stringify(getAll()));

        if (sortByNameDirection === "asc")
            allCats.sort((a, b) => a.name < b.name ? -1 : 1);
        else
            allCats.sort((a, b) => a.name > b.name ? -1 : 1);

        if (pageNumber > 0)
            allCats = allCats.slice(pageSize * (pageNumber - 1), pageSize * pageNumber);

        console.log('service: returning ' + allCats);

        return allCats;
    };

    const getCatCount = () => {
        return getCount();
    }

    const getCatById = (id) => {
        if (Number.isNaN(parseInt(id)))
            return errorCat;

        return getById(parseInt(id));
    }

    const addCat = ({ name, age, weight }) => {
        if (Number.isNaN(parseInt(age)) || Number.isNaN(parseInt(weight)))
            return false;

        add({ name, age, weight });
        return true;
    }

    const updateCat = (id, newCat) => {
        if (Number.isNaN(parseInt(newCat.weight)) || Number.isNaN(parseInt(newCat.age)))
            return false;

        update(id, newCat);
        return true;
    }

    const deleteCat = (id) => {
        deleteById(id);
    }

    return { getAllCatsSortedAndPaginated, getCatCount, getCatById, addCat, updateCat, deleteCat };
}

module.exports = { startCatService };