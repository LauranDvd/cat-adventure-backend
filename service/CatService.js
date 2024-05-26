const { startCatRepository, errorCat } = require('../repository/CatRepository');


const pageSize = 5;

const startCatService = () => {
    const { getAll, getCount, getById, add, deleteById, update, toysPerCat, getUsersFavoriteBreedById } = startCatRepository();

    const getAllCatsSortedAndPaginated = async (sortByNameDirection, pageNumber) => {
        console.log("will get cats: " + sortByNameDirection + pageNumber);

        let allCats = JSON.parse(JSON.stringify(await getAll()));
        console.log('service all: ' + JSON.stringify(allCats));

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

    const getCatById = async (id) => {
        if (Number.isNaN(parseInt(id)))
            return errorCat;

        return await getById(parseInt(id));
    }

    const addCat = ({ name, age, weight }) => {
        if (Number.isNaN(parseInt(age)) || Number.isNaN(parseInt(weight)))
            return false;

        add({ name, age, weight });
        return true;
    }

    const updateCat = async (id, newCat) => {
        if (Number.isNaN(parseInt(newCat.weight)) || Number.isNaN(parseInt(newCat.age)))
            return false;

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

    return { getAllCatsSortedAndPaginated, getCatCount, getCatById, addCat, updateCat, deleteCat, getToysPerCat, getUsersFavoriteBreed };
}

module.exports = { startCatService };