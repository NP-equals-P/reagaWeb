const { Router } = require("express");
const User = require('../../models/users');
const Reac = require('../../models/reactors');

const { createNewReactor } = require("./reactor");

const userRouter = new Router();

// ---------- My Functions ----------
async function createNewUser(username) {

    const reactor = await createNewReactor();

    User.create({
        username: username,
        creationReactor: reactor._id
    });

}
// ---------- My Functions ----------

// ---------- Post Requests ----------
userRouter.post("/registerUser", async (req, res) => {

    const username = req.body.username;

    await createNewUser(username)

    res.redirect("/login?mode=newRegister")
});

userRouter.post("/tryLogin", (req, res) => { 
    var tryUsername = req.body.loginUsername;

    const query = User.find({});

    query.select('username');

    query.exec().then((users) => {
        for (let i = 0; i<users.length; i++) {
            if (tryUsername === users[i].username) {
                res.redirect("/api/user/start?_id=" + users[i]._id);
                return;
            }
        }

        res.redirect("/login?mode=" + 'loginError');
    });
});

// userRouter.delete("/deleteUser", (req, res) => {

//     const logedId = req.query._id;

//     User.findByIdAndDelete(logedId).then(async (user) => {

//         for (let i=0; i<user.reactors.length; i+=1) {

//             await deleteFullReactor(user.reactors);
//         }

//         await deleteFullReactor(user.creationReactor);

//         res.redirect("/login");
//     });
// });
// ---------- Post Requests ----------

// ---------- Get Requests ----------
userRouter.get('/takenCheck', async (req, res) => {

    const username = req.query.username;

    const que = User.find({});
    var taken = false;

    que.select('username');

    const allUsers = await que.exec();

    for (let i = 0; i<allUsers.length; i++) {

        if (username === allUsers[i].username) {

            taken = true;

            break;
        }
    }

    var data = {
        taken: taken
    }

    res.end(JSON.stringify(data));
});

userRouter.get("/start", (req, res) => {
    var logedId = req.query._id;

    User.findById(logedId).then(async (user) => {

        var newList = [];
        var aux;
    
        for (let i=0; i<user.reactors.length; i+=1) {
            aux = await Reac.findById(user.reactors[i]._id);
            newList.push({
                name: aux.name,
                _id: aux._id
            });
        }

        res.render('startPage', {
            data: user,
            reactors: newList});
    })
});
// ---------- Get Requests ----------

module.exports = userRouter;