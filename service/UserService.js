const { startUserRepository } = require('../repository/UserRepository');
const { NEW_PLAYER_MONEY_AMOUNT, ERROR_USER } = require('../utils/Constants');


const startUserService = () => {
    const { getById, getRolesName, getAll, add, deleteById, updateRole,
        updateName, addBasicUserInformation, addMoney, getCutenessLeaderboard } = startUserRepository();

    const getUsersRoleName = async (id) => {
        let user = await getById(id);
        if (user === ERROR_USER) {
            await addBasicUserInformation(id);
            user = await getById(id);
        }

        let rolesName = await getRolesName(user.userRole);
        console.log('service: getusersrolename will return ' + rolesName);

        return rolesName;
    }

    const getUsersMoney = async (id) => {
        let user = await getById(id);
        if (user === ERROR_USER) {
            await addBasicUserInformation(id);
            user = await getById(id);
        }

        return user.money;
    }

    const getAllUsers = async () => {
        return getAll();
    }

    const addUser = ({ name, email, password, role }) => {
        console.log('service will add user with rolename=' + JSON.stringify(role));
        return add({ name, email, password, roleName: role });
    }

    const deleteUser = (userId) => {
        deleteById(userId);
        return true;
    }

    const updateUserRole = (userId, newRole) => {
        console.log(`serv: will update id ${userId} with role ${newRole}`);

        updateRole(userId, newRole);
        return true;
    }

    const updateUserName = (userId, newName) => {
        console.log(`serv: will update id ${userId} with name ${newName}`);

        updateName(userId, newName);
        return true;
    }

    const processBoughtMoney = (userId) => {
        addMoney(userId, NEW_PLAYER_MONEY_AMOUNT);
        return true;
    }

    const getLeaderboard = () => {
        return getCutenessLeaderboard();
    }

    return {
        getUsersRoleName, getUsersMoney, getAllUsers, addUser, deleteUser, updateUserRole, updateUserName,
        processBoughtMoney, getLeaderboard
    };
}

module.exports = { startUserService };
