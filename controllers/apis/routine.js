const { Router } = require("express");
const Reac = require('../../models/reactors');

const routineRouter = new Router();

// ---------- My Functions ----------
function findMaxEventEnd(eventList) {

    var max = 0;

    for (let i=0; i<eventList.length; i+=1) {
        if (eventList[i].end > max) {
            max = eventList[i].end;
        }
    }

    return max;
}
// ---------- My Functions ----------

// ---------- Get Requests ----------
routineRouter.get("/editRoutine", (req, res) => {

    var userId = req.query._id;
    var reacId = req.query.reacId;
    var routId = req.query.routId;

    User.findById(userId).then((user) => {

        Rout.findById(routId).then(async (routine) => {

            const eventList = await findByIdArray(routine.events, Evnt);
            const esporadicEventList = await findByIdArray(routine.esporadicEvents, Evnt);
            const alarmList = await findByIdArray(routine.alarms, Alrm);

            var maxEnd = findMaxEventEnd(eventList);

            res.render("routSettingsPage", {
                user: user,
                reacId: reacId,
                routine: routine,
                events: eventList,
                espEvents: esporadicEventList,
                alarms: alarmList,
                minDuration: maxEnd
            });
        });
    });
});
// ---------- Get Requests ----------

// ---------- Post Requests ----------
// ---------- Post Requests ----------

module.exports = routineRouter;