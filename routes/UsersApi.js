var express = require('express');
var router = express.Router();
const { startUserService } = require('../service/UserService');
const { checkTokenThenExecute, checkAdminTokenThenExecute } = require('../auth/TokenCheck');
const { AUTH0_USER_ID_PREFIX_LENGTH } = require('../utils/Constants');

const { getUsersRoleName, getAllUsers, addUser, deleteUser, updateUserRole, updateUserName, getUsersMoney, processBoughtMoney, getLeaderboard } =
    startUserService();

const userJsonProperties = ["name", "email", "password", "role"];
const REGULAR_USER_ROLE_NAME = "Regular User";
const MANAGER_ROLE_NAME = "Manager";
const ADMIN_ROLE_NAME = "Admin";
const ERROR_MONEY_AMOUNT = -1;

const validateUser = (user) => {
    if (!userHasOnlyTheRequiredProperties(user)) {
        return false;
    }
    if (user.name.length === 0 || user.email.length === 0 || user.password.length === 0) {
        return false;
    }
    if (user.role !== REGULAR_USER_ROLE_NAME && user.role !== MANAGER_ROLE_NAME && user.role !== ADMIN_ROLE_NAME) {
        return false;
    }
    return true;
}

const userHasOnlyTheRequiredProperties = (user) => {
    return userJsonProperties.every(property => user.hasOwnProperty(property))
        && Object.keys(user).length === userJsonProperties.length;
}

router.route("/role-name").get(async (req, res) => {
    return checkTokenThenExecute(req, res, async function (decoded) {
        console.log('role-name get passed the token check.');

        const roleName = await getUsersRoleName(decoded.sub.substring(AUTH0_USER_ID_PREFIX_LENGTH, decoded.sub.length));

        console.log('api will respond with rolename=' + roleName);

        if (roleName === "" || roleName === undefined) {
            return res.status(404).json({ error: `User does not exist or does not have any role assigned` });
        }

        res.status(200).json(roleName);
    });
});

router.route("/money").get(async (req, res) => {
    return checkTokenThenExecute(req, res, async function (decoded) {
        console.log('money get passed the token check');

        const money = await getUsersMoney(decoded.sub.substring(AUTH0_USER_ID_PREFIX_LENGTH, decoded.sub.length));

        console.log('api will respond with money=' + money);

        if (money === ERROR_MONEY_AMOUNT || money === undefined) {
            return res.status(404).json({ error: `User does not exist or does not have money assigned` });
        }

        res.status(200).json(money);
    });
});

router.route("/get-all").get(async (req, res) => {
    return checkAdminTokenThenExecute(req, res, async function (decoded) {
        console.log('get all passed the admin token check');

        const allUsers = await getAllUsers();
        if (allUsers === undefined || allUsers.length === 0) {
            return res.status(400);
        }
        return res.status(200).json(allUsers);
    })
})

router.route("/others-role-name").get(async (req, res) => {
    return checkAdminTokenThenExecute(req, res, async function (decoded) {
        console.log('get others role name passed the admin token check');

        let othersId = req.query.others_id;

        const roleName = await getUsersRoleName(othersId);

        console.log('get others role name will respond with rolename=' + roleName);

        if (roleName === "" || roleName === undefined) {
            return res.status(404).json({ error: `User does not exist or does not have any role assigned` });
        }

        res.status(200).json(roleName);
    });
});

router.route("/create").post(async (req, res) => {
    return checkAdminTokenThenExecute(req, res, async function (decoded) {
        let givenUser = req.body;

        if (!validateUser(givenUser))
            return res.status(400).json({ error: `User has an invalid form` });

        const errors = await addUser(givenUser);
        if (errors === "") {
            return res.json({ message: "Successfully added the user" });
        }
        else {
            console.log('adding invalid user: ' + errors);
            return res.status(400).json({ error: `User is not valid: ${errors}` });
        }
    });
})

router.route("/delete/:user_id").delete(async (req, res) => {
    return checkAdminTokenThenExecute(req, res, async function (decoded) {
        let userId = req.params.user_id;
        console.log('received delete with id=' + JSON.stringify(userId));

        if (deleteUser(userId)) {
            return res.json({ message: "Successfully deleted the user" });
        }
        else {
            return res.status(400).json({ error: `Could not delete the user` });
        }
    });
});

router.route("/update-role/:id").put(async (req, res) => {
    checkAdminTokenThenExecute(req, res, async function (decoded) {
        let givenId = req.params.id;
        givenId = givenId.substring(AUTH0_USER_ID_PREFIX_LENGTH, givenId.length);
        const newRole = req.body.newRole;

        console.log(`api: will update user id=${givenId} with role ${newRole}`);

        let wasSuccessful = updateUserRole(givenId, newRole);

        if (wasSuccessful) {
            return res.json({ message: "Successfully updated the user" });
        }
        else {
            return res.status(400).json({ error: `Update request is not valid` });
        }
    });
});

router.route("/update-name/:id").put(async (req, res) => {
    console.log('entered put update-name');
    checkAdminTokenThenExecute(req, res, async function (decoded) {
        let givenId = req.params.id;
        givenId = givenId.substring(AUTH0_USER_ID_PREFIX_LENGTH, givenId.length);
        const newName = req.body.newName;

        console.log(`api: will update user with id=${givenId} with name ${newName}`);

        let wasSuccessful = updateUserName(givenId, newName);

        if (wasSuccessful) {
            return res.json({ message: "Successfully updated the user" });
        }
        else {
            return res.status(400).json({ error: `Update request is not valid` });
        }
    });
});

router.post("/process-bought-money", async (req, res) => {
    console.log('entered post process-bought-money');

    checkTokenThenExecute(req, res, function (decoded) {
        let userId = decoded.sub.substring(AUTH0_USER_ID_PREFIX_LENGTH, decoded.sub.length);

        if (processBoughtMoney(userId)) {
            return res.json({ message: "Successfully processed bought money" });
        }
        else {
            return res.status(400).json({ error: `Could not process bought money` });
        }
    });
});

router.get("/leaderboard", async (req, res) => {
    const result = await getLeaderboard();
    console.log('api result: ' + JSON.stringify(result));
    res.status(200).json(result);
})


module.exports = router;
