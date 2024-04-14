const { startToyRepository, errorToy } = require('../repository/ToyRepository');


const pageSize = 5;

const startToyService = () => {
    const { getAll, getCount, getById, add, deleteById, update } = startToyRepository();

    const getAllToys = () => {
        let allToys = JSON.parse(JSON.stringify(getAll()));

        return allToys;
    };

    const getToyCount = () => {
        return getCount();
    }

    const getToyById = (id) => {
        if (Number.isNaN(parseInt(id)))
            return errorToy;

        return getById(parseInt(id));
    }

    const addToy = ({ name, catId }) => {
        if (Number.isNaN(parseInt(catId)))
            return false;

        // TODO verify catId exists in cats

        add({ name, catId });
        return true;
    }

    const updateToy = (id, newToy) => {
        if (Number.isNaN(parseInt(newToy.catId)))
            return false;

        update(id, newToy);
        return true;
    }

    const deleteToy = (id) => {
        deleteById(id);
    }

    return { getAllToys, getToyCount, getToyById, addToy, updateToy, deleteToy };
}

module.exports = { startToyService };