var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
const fs = require('fs');
const { startUserService } = require('../service/UserService');
const { checkTokenThenDoStuff, checkAdminTokenThenDoStuff } = require('../auth/TokenCheck');

const { getUsersRoleName, getAllUsers, addUser, deleteUser, updateUserRole, updateUserName, getUsersMoney, processBoughtMoney, getLeaderboard } =
    startUserService();

const validateUser = (user) => {
    if (!user.hasOwnProperty("name") || !user.hasOwnProperty("email") || !user.hasOwnProperty("password") || !user.hasOwnProperty("role"))
        return false;
    if (Object.keys(user).length !== 4)
        return false;
    if (user.name.length === 0 || user.email.length === 0 || user.password.length === 0)
        return false;
    if (user.role !== "Regular User" && user.role !== "Manager" && user.role !== "Admin")
        return false;
    return true;
}

router.route("/role-name").get(async (req, res) => {
    return checkTokenThenDoStuff(req, res, async function (decoded) {
        console.log('you passed the token check.');

        const roleName = await getUsersRoleName(decoded.sub.substring(6, decoded.sub.length));

        console.log('will respond with rolename=' + roleName);

        if (roleName === "" || roleName === undefined) {
            return res.status(404).json({ error: `User doesnt exist or doesnt have any role assigned` });
        }

        res.status(200).json(roleName);
    });
});

router.route("/money").get(async (req, res) => {
    return checkTokenThenDoStuff(req, res, async function (decoded) {
        console.log('passed the token check');

        const money = await getUsersMoney(decoded.sub.substring(6, decoded.sub.length));

        console.log('will respond with money=' + money);

        if (money === -1 || money === undefined) {
            return res.status(404).json({ error: `User doesnt exist or doesnt have money assigned` });
        }

        res.status(200).json(money);
    });
});

router.route("/get-all").get(async (req, res) => {
    return checkAdminTokenThenDoStuff(req, res, async function (decoded) {
        console.log('you passed the admin token check');

        const allUsers = await getAllUsers();
        if (allUsers === undefined || allUsers.length === 0)
            return res.status(400);
        return res.status(200).json(allUsers);
    })
})

router.route("/others-role-name").get(async (req, res) => {
    return checkAdminTokenThenDoStuff(req, res, async function (decoded) {
        console.log('passed the admin token check');

        let othersId = req.query.others_id;

        const roleName = await getUsersRoleName(othersId);

        console.log('will respond with rolename=' + roleName);

        if (roleName === "" || roleName === undefined) {
            return res.status(404).json({ error: `User doesnt exist or doesnt have any role assigned` });
        }

        res.status(200).json(roleName);
    });
});

router.route("/create").post(async (req, res) => {
    return checkAdminTokenThenDoStuff(req, res, async function (decoded) {
        let givenUser = req.body;

        if (!validateUser(givenUser))
            return res.status(400).json({ error: `User has an invalid form` });

        const errors = await addUser(givenUser);
        if (errors === "")
            return res.json({ message: "Successfully added the user" });
        else {
            console.log('adding invalid user: ' + errors);
            return res.status(400).json({ error: `User is not valid: ${errors}` });
        }
    });
})

router.route("/delete/:user_id").delete(async (req, res) => {
    return checkAdminTokenThenDoStuff(req, res, async function (decoded) {
        let userId = req.params.user_id;
        console.log('received delete with id=' + JSON.stringify(userId));

        if (deleteUser(userId))
            return res.json({ message: "Successfully deleted the user" });
        else
            return res.status(400).json({ error: `Could not delete the user` });
    });
});

router.route("/update-role/:id").put(async (req, res) => {
    checkAdminTokenThenDoStuff(req, res, async function (decoded) {
        let givenId = req.params.id;
        givenId = givenId.substring(6, givenId.length);
        const newRole = req.body.newRole;

        console.log(`api: will update id ${givenId} with role ${newRole}`);

        let successful = await updateUserRole(givenId, newRole);

        if (successful)
            return res.json({ message: "Successfully updated the user" });
        else
            return res.status(400).json({ error: `Update request is not valid` });
    });
});

router.route("/update-name/:id").put(async (req, res) => {
    console.log('in update-name!');
    checkAdminTokenThenDoStuff(req, res, async function (decoded) {
        let givenId = req.params.id;
        givenId = givenId.substring(6, givenId.length);
        const newName = req.body.newName;

        console.log(`api: will update id ${givenId} with name ${newName}`);

        let successful = await updateUserName(givenId, newName);

        if (successful)
            return res.json({ message: "Successfully updated the user" });
        else
            return res.status(400).json({ error: `Update request is not valid` });
    });
});

router.post("/process-bought-money", async (req, res) => {
    console.log('api process bought');

    checkTokenThenDoStuff(req, res, function (decoded) {
        let userId = decoded.sub.substring(6, decoded.sub.length);

        if (processBoughtMoney(userId))
            return res.json({ message: "Successfully processed bought money" });
        else
            return res.status(400).json({ error: `Could not process bought money` });
    });
});

router.get("/leaderboard", async (req, res) => {
    const result = await getLeaderboard();
    console.log('api result: ' + JSON.stringify(result));
    res.status(200).json(result);
})


module.exports = router;
