const { startToyRepository, errorToy } = require('../repository/ToyRepository');


const startToyService = () => {
    const { getAll, getCount, getById, add, deleteById, update } = startToyRepository();

    const getAllToys = async () => {
        let allToys = JSON.parse(JSON.stringify(await getAll()));

        return allToys;
    };

    const getToyCount = async () => {
        console.log('daaa');
        return await getCount();
    }

    const getToyById = async (id) => {
        if (Number.isNaN(parseInt(id)))
            return errorToy;

        return await getById(parseInt(id));
    }

    const addToy = ({ name, catId }) => {
        if (Number.isNaN(parseInt(catId)))
            return false;

        // TODO verify catId exists in cats

        add({ name, catId });
        return true;
    }

    const updateToy = async (id, newToy) => {
        if (Number.isNaN(parseInt(newToy.catId)))
            return false;

        await update(id, newToy);
        return true;
    }

    const deleteToy = (id) => {
        deleteById(id);
    }

    return { getAllToys, getToyCount, getToyById, addToy, updateToy, deleteToy };
}

module.exports = { startToyService };