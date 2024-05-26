const connectToDatabase = require("../database/DBConnection");
const axios = require('axios');

const errorUser = { id: -1, favoriteBreed: "Error", userRole: -1 };

const startUserRepository = () => {
    const getAllInDatabase = async () => {
        const db = await connectToDatabase();
        let collection = await db.collection("AppUsers");
        let results = await collection.find({})
            .toArray();
        results = results.map(user => ({ id: user.id, favoriteBreed: user.favoriteBreed, userRole: user.userRole }));
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
        console.log('config for axios: ' + JSON.stringify(config));

        return axios.request(config)
            .then((response) => {
                console.log('in repository response: ' + JSON.stringify(response.data));
                return response.data;
            })
            .catch((error) => {
                console.log(error);
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

        axios.request(config)
            .then(async (response) => {
                const userId = response.data.user_id;
                console.log('added user id: ' + JSON.stringify(userId));

                const db = await connectToDatabase();
                let collection = await db.collection("AppUsers");
                const userForDb = { id: userId.substring(6, userId.length), favoriteBreed: "", userRole: roleId };
                await collection.insertOne(userForDb);
            })
            .catch((error) => {
                console.log(error);
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

        // allCats = allCats.map(currentCat => {
        //     if (currentCat.id === id)
        //         return newCat;
        //     return currentCat;
        // });
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

    return { getById, getRolesName, isUserAdminOrManager, isUserAdmin, getAll, add, deleteById, updateRole, updateName };
}

module.exports = { startUserRepository, errorUser };
