const { startCatRepository, errorCat } = require('../repository/CatRepository');


const pageSize = 5;

const startCatService = () => {
    const { getAll, getCount, getById, add, deleteById, update, toysPerCat, getUsersFavoriteBreedById, getAllSortedPaginated,
        getAgeDistribution
    } =
        startCatRepository();

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

    return {
        getAllCatsSortedAndPaginated, getCatCount, getCatById, addCat, updateCat, deleteCat, getToysPerCat, getUsersFavoriteBreed,
        getCatAgeDistribution
    };
}

module.exports = { startCatService };