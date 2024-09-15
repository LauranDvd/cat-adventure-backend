const connectToDatabase = require("../database/DBConnection");
const axios = require('axios');
const { NEW_PLAYER_MONEY_AMOUNT, ERROR_USER, ERROR_STRING, CATS_MONGO_COLLECTION_NAME, USER_ROLES_MONGO_COLLECTION_NAME,
    USERS_MONGO_COLLECTION_NAME,
    MANAGER_USER_ROLE,
    ADMIN_USER_ROLE,
    AUTH0_USER_ID_PREFIX_LENGTH,
    REGULAR_USER_ROLE_ID } = require("../utils/Constants");

const AUTH0_API_MAIN_ENDPOINT = 'https://dev-71pxajof3gt25bcw.us.auth0.com/api/v2/users';

const startUserRepository = () => {
    const getAllInDatabase = async () => {
        const db = await connectToDatabase();
        let collection = await db.collection(USERS_MONGO_COLLECTION_NAME);
        let results = await collection.find({})
            .toArray();
        results = results.map(user => ({ id: user.id, favoriteBreed: user.favoriteBreed, userRole: user.userRole, money: user.money }));
        return results;
    };

    const getById = async (id) => {
        const allUsers = await getAllInDatabase();
        console.log('all users: ' + JSON.stringify(allUsers));
        console.log('get by id - id parameter: ' + JSON.stringify(id));
        const user = allUsers.find(user => user.id === id);
        if (user !== undefined)
            return user;
        return ERROR_USER;
    }

    const getRolesName = async (roleId) => {
        const db = await connectToDatabase();
        let userRoles = await db.collection(USER_ROLES_MONGO_COLLECTION_NAME);
        let filteredUserRoles = await userRoles.find({ roleId: roleId })
            .toArray();

        if (filteredUserRoles[0])
            return filteredUserRoles[0].roleName;
        return ERROR_STRING;
    }

    const isUserAdminOrManager = async (userId) => {
        const user = await getById(userId);
        const usersRoleId = user.userRole;
        const usersRoleName = await getRolesName(usersRoleId);

        console.log('isuseradminormanager: role=' + JSON.stringify(usersRoleName));

        return usersRoleName === MANAGER_USER_ROLE || usersRoleName === ADMIN_USER_ROLE;
    }

    const isUserAdmin = async (userId) => {
        const user = await getById(userId);
        const usersRoleId = user.userRole;
        const usersRoleName = await getRolesName(usersRoleId);

        console.log('isuseradmin: role=' + JSON.stringify(usersRoleName));

        return usersRoleName === ADMIN_USER_ROLE;
    }

    const getAll = async () => {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: AUTH0_API_MAIN_ENDPOINT,
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.MANAGEMENT_API_TOKEN}`
            }
        };

        return axios.request(config)
            .then((response) => {
                console.log('repository response for getAll: ' + JSON.stringify(response.data));
                return response.data;
            })
            .catch((error) => {
                console.log("get all users auth0 error: " + JSON.stringify(error));
            });
    }

    const add = async ({ name, email, password, roleName }) => {
        console.log('repo will add user with rolename=' + JSON.stringify(roleName));
        const db = await connectToDatabase();
        const userRolesCollection = db.collection(USER_ROLES_MONGO_COLLECTION_NAME);
        const role = await userRolesCollection.findOne({ roleName: roleName });
        if (!role) {
            throw new Error(`Role with name ${roleName} not found`);
        }
        const roleId = role.roleId;

        let data = {
            name: name, email: email, password: password, connection: "Username-Password-Authentication"
        };

        let config = {
            method: 'post',
            maxBodyLength: Infinity,
            url: AUTH0_API_MAIN_ENDPOINT,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.MANAGEMENT_API_TOKEN}`
            },
            data: data
        };

        return axios.request(config)
            .then(async (response) => {
                const userId = response.data.user_id;
                console.log('added user id: ' + JSON.stringify(userId));

                const db = await connectToDatabase();
                let collection = await db.collection(USERS_MONGO_COLLECTION_NAME);
                const userForDb = { id: userId.substring(AUTH0_USER_ID_PREFIX_LENGTH, userId.length), favoriteBreed: "", userRole: roleId };
                await collection.insertOne(userForDb);

                return "";
            })
            .catch((error) => {
                console.log(error);
                return error;
            });
    }

    const deleteById = async (userId) => {
        let config = {
            method: 'delete',
            maxBodyLength: Infinity,
            url: `${AUTH0_API_MAIN_ENDPOINT}/${userId}`,
            headers: {
                'Authorization': `Bearer ${process.env.MANAGEMENT_API_TOKEN}`
            }
        };

        axios.request(config)
            .then((response) => {
                console.log('delete response: ' + JSON.stringify(response.data));
            })
            .catch((error) => {
                console.log(error);
            });
    }

    const updateRole = async (id, newRole) => {
        console.log(`repository: will update id ${id} with role ${newRole}`);

        const db = await connectToDatabase();

        const userRolesCollection = db.collection(USER_ROLES_MONGO_COLLECTION_NAME);
        const role = await userRolesCollection.findOne({ roleName: newRole });
        if (!role) {
            throw new Error(`Role with name ${newRole} not found`);
        }
        const roleId = role.roleId;

        const query = { id: id };
        const updates = { $set: { userRole: roleId } };
        const appUsersCollection = await db.collection(USERS_MONGO_COLLECTION_NAME);
        await appUsersCollection.updateOne(query, updates);
    }

    const updateName = async (id, newName) => {
        console.log(`repository: will update id ${id} with name ${newName}`);

        let data = JSON.stringify({
            "name": newName
        });

        let config = {
            method: 'patch',
            maxBodyLength: Infinity,
            url: `${AUTH0_API_MAIN_ENDPOINT}/auth0|` + id,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.MANAGEMENT_API_TOKEN}`
            },
            data: data
        };

        axios.request(config)
            .then((response) => {
                console.log('update name response: ' + JSON.stringify(response.data));
            })
            .catch((error) => {
                console.log(error);
            });
    }

    const addBasicUserInformation = async (id) => {
        const db = await connectToDatabase();
        let collection = await db.collection(USERS_MONGO_COLLECTION_NAME);
        const userForDb = { id: id, favoriteBreed: "", userRole: REGULAR_USER_ROLE_ID, money: NEW_PLAYER_MONEY_AMOUNT };
        await collection.insertOne(userForDb);
    }

    const addMoney = async (userId, amount) => {
        console.log(`Adding money: User ID ${userId}, Amount ${amount}`);

        const db = await connectToDatabase();
        const collection = db.collection(USERS_MONGO_COLLECTION_NAME);

        await collection.updateOne(
            { id: userId },
            { $inc: { money: amount } }
        );
    }

    const getByIdAuth0 = async (wantedId) => {
        const allUsers = await getAll();
        return (allUsers.filter(user => {
            return user.identities[0].user_id === wantedId;
        }))[0];
    }

    const getCutenessLeaderboard = async () => {
        console.log(`repository will get leaderboard`);
        try {
            const db = await connectToDatabase();
            const catsCollection = db.collection(CATS_MONGO_COLLECTION_NAME);

            const leaderboardAggregation = [
                {
                    $match: {
                        ownerId: { $exists: true, $ne: null },
                        cuteness: { $exists: true, $ne: null }
                    }
                },
                {
                    $group: {
                        _id: "$ownerId",
                        totalCuteness: { $sum: "$cuteness" }
                    }
                },
                {
                    $lookup: {
                        from: USERS_MONGO_COLLECTION_NAME,
                        localField: "_id",
                        foreignField: "id",
                        as: "user"
                    }
                },
                {
                    $unwind: "$user"
                },
                {
                    $project: {
                        _id: 0,
                        userName: "$user.id",
                        totalCuteness: 1
                    }
                },
                {
                    $sort: { totalCuteness: -1 }
                }
            ];

            const leaderboard = await catsCollection.aggregate(leaderboardAggregation).toArray();
            const allUsersAuth0 = await getAll();
            for (let entry of leaderboard) {
                console.log(`leaderboard entry: ${JSON.stringify(entry)}`);

                const user = (allUsersAuth0.filter(testedUser => {
                    return testedUser.identities[0].user_id === entry.userName;
                }))[0];
                console.log(`leaderboard - auth0 user: ${JSON.stringify(user)}`);
                entry.userName = user.name || ERROR_STRING;
            }
            console.log(`repository leaderboard: ${JSON.stringify(leaderboard)}`);

            return leaderboard;
        } catch (error) {
            console.error('Error fetching cuteness leaderboard:', error);
            return [];
        }
    }

    return {
        getById, getRolesName, isUserAdminOrManager, isUserAdmin, getAll, add, deleteById, updateRole,
        updateName, addBasicUserInformation, addMoney, getCutenessLeaderboard, getByIdAuth0
    };
}

module.exports = { startUserRepository };
