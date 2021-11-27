import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Paper, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import React from "react";
import { Activity, ActivityInfo, ClientLogActivityRequest, LoggedActivityInfo, ServerCalendarResponse } from "./protocol";
import { getCalendarInfo, getLoggedActivityInfo, PUT } from "./transport";
import { renderActivity } from "./activity";

let infoQuery: Promise<ServerCalendarResponse> | undefined = undefined;

function refreshCalendar(setAvailableActivities: (activities: Array<ActivityInfo[]>) => void, setLoggedActivities: (logged: LoggedActivityInfo[]) => void) {
    if (typeof infoQuery !== 'undefined') {
        return;
    }
    infoQuery = getCalendarInfo();
        infoQuery.then(response => {
            if (typeof response.available_activities !== 'undefined') {
                setAvailableActivities(response.available_activities);
            }
            if (typeof response.logged_activities !== 'undefined') {
                setLoggedActivities(response.logged_activities);
            }
            infoQuery = undefined;
        })
        .catch(error => console.log(error))
        .finally(() => infoQuery = undefined);
}

export function Calendar() {
    const [registeringActivity, setRegisteringActivity] = React.useState(false);
    const [currentlyOpenedDay, setCurrentlyOpenedDay] = React.useState(0);
    const [loggedActivities, setLoggedActivities] = React.useState<LoggedActivityInfo[]>([]);
    const [availableActivities, setAvailableActivities] = React.useState<Array<ActivityInfo[]>>([]);
    const [selectedActivityForRegistration, setSelectedActivityForRegistration] = React.useState<Activity>('RUN');
    const [activityDistanceForRegistration, setActivityDistanceForRegistration] = React.useState<string>('');

    let parsedDistance = -1;
    let validDistance = false;
    try {
        parsedDistance = Number.parseInt(activityDistanceForRegistration);
        if (parsedDistance >= 0) {
            validDistance = true;
        }
    } catch (_) {

    }

    setTimeout(() => {
        if (availableActivities.length === 0) {
            refreshCalendar(setAvailableActivities, setLoggedActivities);
        }
    }, 50); // Wait until initial pageload is done, then trigger update

    const openRegisterActivityDialog = (day: number) => {
        setCurrentlyOpenedDay(day);
        setRegisteringActivity(true);
    }
    const closeRegisterActivityDialog = (event: React.MouseEvent<HTMLButtonElement>) => {
        setRegisteringActivity(false);
        if (event.currentTarget.id === 'register' && validDistance) {
            const currentActivitySet = getActivitiesForDay(currentlyOpenedDay, availableActivities);
            if (typeof currentActivitySet !== 'undefined') {
                for (const act of currentActivitySet) {
                    if (act.activity === selectedActivityForRegistration) {
                        const req: ClientLogActivityRequest = {
                            day: currentlyOpenedDay,
                            info: {
                                activity: act.activity,
                                value: parsedDistance
                            }
                        };
                        PUT<{}>('/log-activity', JSON.stringify(req)).then(() => refreshCalendar(setAvailableActivities, setLoggedActivities))
                            .catch(error => console.error(`Failed to log activity: ${error}`));

                        return;
                    }
                }
            }
        }
    }

    const handleLogActivityDistanceChanged = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
        setActivityDistanceForRegistration(event.currentTarget.value);
    }

    const days = [];
    for (let i = 0; i < 24; i++) {
        days.push(i);
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
            { CurrentDayActivities(currentlyOpenedDay, availableActivities, selectedActivityForRegistration, setSelectedActivityForRegistration) }
            <TextField
                    autoFocus
                    margin='dense'
                    id='distance'
                    label='Distance'
                    type='text'
                    fullWidth
                    variant="standard"
                    onChange={handleLogActivityDistanceChanged}
                />
            </DialogContent>
            <DialogActions>
            <Button onClick={closeRegisterActivityDialog} id='cancel'>Cancel</Button>
            <Button onClick={closeRegisterActivityDialog} id='register' disabled={!validDistance}>Log</Button>
            </DialogActions>
        </Dialog>
        </div>
    );
}

function CurrentDayActivities(dayOfDecZeroIndexed: number, availableActivities: Array<ActivityInfo[]>, selectedActivity: Activity, setSelectedActivity: (activity: Activity) => void): React.ReactFragment {
    const todayActivities = getActivitiesForDay(dayOfDecZeroIndexed, availableActivities);

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
                    todayActivities.map(a => <ToggleButton value={a.activity}>{renderActivity(a.activity)} { a.value }</ToggleButton>)
            }
        </ToggleButtonGroup>
    );
}

function renderDay(day: number, openRegisterActivityDialog: (day: number) => void, loggedActivities: LoggedActivityInfo[]): React.ReactFragment {
    const locked: boolean = isLocked(day);
    const loggedActivity = getLoggedActivityInfo(day, loggedActivities);
    return (
        <div className="calendar-day">
            <Paper elevation={10} >
                <IconButton color="primary" aria-label="open-day" onClick={locked ? clickedDay : () => openRegisterActivityDialog(day) } id={day.toString()}>
                    { locked ? 
                            <LockIcon></LockIcon>
                        :
                        typeof loggedActivity !== 'undefined' ?
                            <div> {renderActivity(loggedActivity.activity)} {loggedActivity.value} </div>
                            :
                            <LockOpenIcon></LockOpenIcon>
                    }
                </IconButton>
                { day + 1 }
            </Paper>
        </div>
    );
}

function getActivitiesForDay(dayOfDecZeroIndexed: number, availableActivities: Array<ActivityInfo[]>): ActivityInfo[] | undefined {
    if (dayOfDecZeroIndexed < availableActivities.length && dayOfDecZeroIndexed >= 0) {
        const newArr = [];
        for (let i = 0; i < availableActivities[dayOfDecZeroIndexed].length; i++) {
            newArr.push(availableActivities[dayOfDecZeroIndexed][i]);
        }
        return newArr;
    }
    return undefined;
}

function isLocked(day: number): boolean {
    return day > getCurrentDay();
}

function clickedDay(event: React.MouseEvent<HTMLButtonElement>) {
    let clickedDate = Number.parseInt(event.currentTarget.id);
    if (!isLocked(clickedDate)) {
        alert('hmmm!');

    }
}

function getCurrentDay(): number {
    // TODO Dummy-date for testing, use actual new Date(); once we are done testing
    return 10; // Unlock a few days for testing
}