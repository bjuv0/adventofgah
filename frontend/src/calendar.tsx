import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Paper, ToggleButton, ToggleButtonGroup } from "@mui/material";
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import React from "react";
import { Activity, ActivityInfo, LoggedActivityInfo, ServerCalendarResponse } from "./protocol";
import { getCalendarInfo, getLoggedActivityInfo } from "./transport";
import { renderActivity } from "./activity";

let infoQuery: Promise<ServerCalendarResponse> | undefined = undefined;

export function Calendar() {
    const [registeringActivity, setRegisteringActivity] = React.useState(false);
    const [currentlyOpenedDay, setCurrentlyOpenedDay] = React.useState(0);
    const [loggedActivities, setLoggedActivities] = React.useState<LoggedActivityInfo[]>([]);
    const [availableActivities, setAvailableActivities] = React.useState<Array<ActivityInfo[]>>([]);

    if (typeof infoQuery === 'undefined' && availableActivities.length === 0) {
        infoQuery = getCalendarInfo();
        infoQuery.then(response => {
            if (typeof response.available_activities !== 'undefined') {
                setAvailableActivities(response.available_activities);
            }
            if (typeof response.logged_activities !== 'undefined') {
                setLoggedActivities(response.logged_activities);
            }
        })
        .catch(error => console.log(error))
        .finally(() => infoQuery = undefined);
    }

    const openRegisterActivityDialog = (day: Date) => {
        setCurrentlyOpenedDay(day.getDate());
        setRegisteringActivity(true);
    }
    const closeRegisterActivityDialog = () => {
        setRegisteringActivity(false);
    }

    const days = [];
    for (let i = 1; i <= 24; i++) {
        days.push(new Date(`2021-12-${i}`));
    }
    return (
        <div>
        <table>
            <tr>
                { days.slice(0, 8).map(d => (<td>{renderDay(d, openRegisterActivityDialog, loggedActivities)}</td>)) }
            </tr>
            <tr>
                { days.slice(8, 16).map(d => (<td>{renderDay(d, openRegisterActivityDialog, loggedActivities)}</td>)) }
            </tr>
            <tr>
                { days.slice(16, 24).map(d => (<td>{renderDay(d, openRegisterActivityDialog, loggedActivities)}</td>)) }
            </tr>
        </table>
        <Dialog open={registeringActivity} onClose={closeRegisterActivityDialog}>
            <DialogTitle>Register activity</DialogTitle>
            <DialogContent>
            <DialogContentText>
                Activities available to choose from today are:
            </DialogContentText>
            { CurrentDayActivities(currentlyOpenedDay - 1, availableActivities) }
            </DialogContent>
            <DialogActions>
            <Button onClick={closeRegisterActivityDialog}>Cancel</Button>
            <Button onClick={closeRegisterActivityDialog}>Select</Button>
            </DialogActions>
        </Dialog>
        </div>
    );
}

function CurrentDayActivities(dayOfDecZeroIndexed: number, availableActivities: Array<ActivityInfo[]>): React.ReactFragment {
    let todayActivities: ActivityInfo[] | undefined = undefined;
    if (dayOfDecZeroIndexed < availableActivities.length && dayOfDecZeroIndexed >= 0) {
        todayActivities = [];
        for (let i = 0; i < availableActivities[dayOfDecZeroIndexed].length; i++) {
            todayActivities.push(availableActivities[dayOfDecZeroIndexed][i]);
        }
    }
    const [selectedActivity, setSelectedActivity] = React.useState<Activity>('RUN');

    const handleChangedActivity = (event: any, newActivity: Activity) => {
        setSelectedActivity(newActivity);
    }

    return (
        <ToggleButtonGroup
            color="primary"
            value={selectedActivity}
            exclusive
            onChange={handleChangedActivity}
            >
            {
                typeof todayActivities === 'undefined' ?
                    <p>"No activities"</p>
                :
                    todayActivities.map(a => {
                    return <ToggleButton value={a.activity}>{renderActivity(a.activity)} { a.value }</ToggleButton>;
                })
            }
        </ToggleButtonGroup>
    );
}

function renderDay(day: Date, openRegisterActivityDialog: (day: Date) => void, loggedActivities: LoggedActivityInfo[]): React.ReactFragment {
    const locked: boolean = isLocked(day);
    const loggedActivity = getLoggedActivityInfo(day, loggedActivities);
    return (
        <div className="calendar-day">
            <Paper elevation={10} >
                <IconButton color="primary" aria-label="open-day" onClick={locked ? clickedDay : () => openRegisterActivityDialog(day) } id={day.toISOString()}>
                    { locked ? 
                            <LockIcon></LockIcon>
                        :
                        typeof loggedActivity !== 'undefined' ?
                            <div> {renderActivity(loggedActivity.activity)} {loggedActivity.value} </div>
                            :
                            <LockOpenIcon></LockOpenIcon>
                    }
                </IconButton>
                {day.getDate() }
            </Paper>
        </div>
    );
}

function isLocked(day: Date): boolean {
    return day.getTime() > getCurrentDay().getTime();
}

function clickedDay(event: React.MouseEvent<HTMLButtonElement>) {
    let clickedDate = new Date(event.currentTarget.id);
    if (!isLocked(clickedDate)) {
        alert('hmmm!');

    }
}

function getCurrentDay(): Date {
    // TODO Dummy-date for testing, use actual new Date(); once we are done testing
    return new Date("2021-12-11"); // Unlock a few days for testing
}