const express = require("express");
const mongoose = require('mongoose');
const mainRouter = require("./controllers");

// ---------- My Functions ----------
async function checkValidAction(evntId, newStart, newEnd, newComponent, actiId) {
    const myEvent = await Evnt.findById(evntId);
    var action;
    var actionEnd;

    for (let i=0; i<myEvent.actions.length; i+=1) {
        if (!(actiId === myEvent.actions[i].toString())) {
            action = await Acti.findById(myEvent.actions[i]);
            actionEnd = action.start + action.end;
            if (newComponent.toString() === action.component.toString()) {
                if (!(newEnd <= action.start) && !(newStart >= actionEnd)) {
                    return false;
                }
            }
        }
    }

    return true;
}

async function checkValidEvent(routId, newStart, newEnd, evntId) {
    const myRout = await Rout.findById(routId);
    const newEvent = await Evnt.findById(evntId);

    var eventEnd;
    var event;

    for (let i=0; i<myRout.events.length; i+=1) {
        event = await Evnt.findById(myRout.events[i]);

        if (!(event._id.toString() === evntId)) {
            if (event.type === "normal") {
                eventEnd = event.end;
        
                if (!(newEnd <= event.start) && !(newStart >= eventEnd)) {
                    for (let j=0; j<newEvent.actions.length; j+=1) {
                        for (let k=0; k<event.actions.length; k+=1) {
                            var newEventActi = await Acti.findById(newEvent.actions[j])
                            var eventActi = await Acti.findById(event.actions[k])
                            if (newEventActi.component.toString() === eventActi.component.toString()) {
                                return false
                            }
                        }
                    }
                }
            }
        }
    }

    return true;
}
// ---------- My Functions ----------

// ---------- Mongoose Models ----------
const User = require('./models/users');
const Reac = require('./models/reactors');
const Sens = require('./models/sensors');
const Actu = require('./models/actuators');
const Rout = require('./models/routines');
const Evnt = require('./models/events');
const Acti = require('./models/actions');
const Alrm = require('./models/alarms');
const CoMo = require('./models/componentsModels');
const Func = require('./models/functions');
// ---------- Mongoose Models ----------

// ---------- Configs ----------
const app = express();

app.use(express.urlencoded({ extended: true })); //TODO: Danger zone! I don't know what these lines do.
app.set('view engine', 'ejs');
app.use(express.static('views'));
app.use(express.json());

app.use("/", mainRouter); //Routing
// ---------- Configs ----------

// ---------- Connect to DB ----------
//const urI = 'mongodb://usrbioma:B%21omA2024@db-bioma.feagri.unicamp.br:27017/bioma?retryWrites=true&loadBalanced=false&serverSelectionTimeoutMS=5000&connectTimeoutMS=10000&authSource=bioma&authMechanism=SCRAM-SHA-256';

const urI = "mongodb+srv://ito:senhaito@cluster0.2muvzud.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(urI)
    .then((result) => app.listen(3000))
    .catch((err) => console.log(err));
// ---------- Connect to DB ----------

// ---------- Post Requests ----------
app.post("/callEsporadicEvent", (req, res) => {
    var userId = req.body._id;
    var evntId = req.body.evntId;
    var reacId = req.body.reacId;
    
    Evnt.findByIdAndUpdate(evntId, {$set: {inQueue: true}}).then((event) => {
        res.redirect("/reacView?_id=" + userId + "&reacId=" + reacId)
    });
});
// ---------- Post Requests ----------

//App requests
app.get('/login', (req, res) => {
    res.render('loginPage', {mode: req.query.mode});
});

app.get('/register', (req, res) => {
    res.render('registerPage', {mode: req.query.mode});
});

app.use((req, res) => {
    res.render('loginPage', {mode: 'normal'})
});
