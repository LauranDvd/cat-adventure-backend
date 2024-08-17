const connectToDatabase = require("../database/DBConnection");
const axios = require('axios');

const errorUser = { id: -1, favoriteBreed: "Error", userRole: -1, money: -1 };
const NEW_PLAYER_MONEY_AMOUNT = 50;
const ERROR_STRING = "error";

const startUserRepository = () => {
    const getAllInDatabase = async () => {
        const db = await connectToDatabase();
        let collection = await db.collection("AppUsers");
        let results = await collection.find({})
            .toArray();
        results = results.map(user => ({ id: user.id, favoriteBreed: user.favoriteBreed, userRole: user.userRole, money: user.money }));
        return results;
    };

    const getById = async (id) => {
        const allUsers = await getAllInDatabase();
        console.log('allusers: ' + JSON.stringify(allUsers));
        console.log('id parameter: ' + JSON.stringify(id));
        const user = allUsers.find(user => user.id === id);
        if (user !== undefined)
            return user;
        return errorUser;
    }

    const getRolesName = async (roleId) => {
        const db = await connectToDatabase();
        let userRoles = await db.collection("UserRoles");
        let filteredUserRoles = await userRoles.find({ roleId: roleId })
            .toArray();

        if (filteredUserRoles[0])
            return filteredUserRoles[0].roleName;
        return "error";
    }

    const isUserAdminOrManager = async (userId) => {
        const user = await getById(userId);
        const usersRoleId = user.userRole;
        const usersRoleName = await getRolesName(usersRoleId);

        console.log('isuseradminormanager: usersrolename=' + JSON.stringify(usersRoleName));

        return usersRoleName === "Manager" || usersRoleName === "Admin";
    }

    const isUserAdmin = async (userId) => {
        const user = await getById(userId);
        const usersRoleId = user.userRole;
        const usersRoleName = await getRolesName(usersRoleId);

        console.log('isuseradmin: usersrolename=' + JSON.stringify(usersRoleName));

        return usersRoleName === "Admin";
    }

    const getAll = async () => {
        let config = {
            method: 'get',
            maxBodyLength: Infinity,
            url: 'https://dev-71pxajof3gt25bcw.us.auth0.com/api/v2/users',
            headers: {
                'Accept': 'application/json',
                'Authorization': `Bearer ${process.env.MANAGEMENT_API_TOKEN}`
            }
        };

        return axios.request(config)
            .then((response) => {
                console.log('in repository response for getAll: ' + JSON.stringify(response.data));
                return response.data;
            })
            .catch((error) => {
                console.log("getAll users auth0 error: " + JSON.stringify(error));
            });
    }

    const add = async ({ name, email, password, roleName }) => {
        console.log('repo will add user with rolename=' + JSON.stringify(roleName));
        const db = await connectToDatabase();
        const userRolesCollection = db.collection("UserRoles");
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
            url: 'https://dev-71pxajof3gt25bcw.us.auth0.com/api/v2/users',
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
                let collection = await db.collection("AppUsers");
                const userForDb = { id: userId.substring(6, userId.length), favoriteBreed: "", userRole: roleId };
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
            url: `https://dev-71pxajof3gt25bcw.us.auth0.com/api/v2/users/${userId}`,
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

        const userRolesCollection = db.collection("UserRoles");
        const role = await userRolesCollection.findOne({ roleName: newRole });
        if (!role) {
            throw new Error(`Role with name ${newRole} not found`);
        }
        const roleId = role.roleId;

        const query = { id: id };
        const updates = { $set: { userRole: roleId } };
        const appUsersCollection = await db.collection("AppUsers");
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
            url: 'https://dev-71pxajof3gt25bcw.us.auth0.com/api/v2/users/auth0|' + id,
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
        let collection = await db.collection("AppUsers");
        const userForDb = { id: id, favoriteBreed: "", userRole: 1, money: NEW_PLAYER_MONEY_AMOUNT };
        await collection.insertOne(userForDb);
    }

    const addMoney = async (userId, amount) => {
        console.log(`Adding money: User ID ${userId}, Amount ${amount}`);

        const db = await connectToDatabase();
        const collection = db.collection("AppUsers");

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
        console.log(`will get leaderboard`);
        try {
            const db = await connectToDatabase();
            const catsCollection = db.collection("Cats");

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
                        from: "AppUsers",
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

                // const user = await getByIdAuth0(entry.userName);
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

module.exports = { startUserRepository, errorUser };
