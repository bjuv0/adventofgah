import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Paper, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import React from "react";
import { Achievement, Activity, ActivityInfo, ClientLogActivityRequest, LoggedActivityInfo, ServerCalendarResponse, ServerLogActivityResponse } from "./protocol";
import { getCalendarInfo, getLoggedActivityInfo, PUT } from "./transport";
import { renderActivity } from "./activity";
import './calendar.css';
import { renderAchievement } from "./achievements";

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
    const [currentlyOpenedDay, setCurrentlyOpenedDay] = React.useState(-1);
    const [loggedActivities, setLoggedActivities] = React.useState<LoggedActivityInfo[]>([]);
    const [availableActivities, setAvailableActivities] = React.useState<Array<ActivityInfo[]>>([]);
    const [selectedActivityForRegistration, setSelectedActivityForRegistration] = React.useState<Activity>('RUN');
    const [activityDistanceForRegistration, setActivityDistanceForRegistration] = React.useState<string>('');
    const [openingDay, setOpeningDay] = React.useState<number>(-1);
    const [closingDay, setClosingDay] = React.useState<number>(-1);
    const [unlockedAchievements, setUnlockedAchievements] = React.useState<Achievement[]>([]);

    const todayActivities = getActivitiesForDay(currentlyOpenedDay, availableActivities);
    const alreadyLoggedActivityForOpening = loggedActivities.find(a => a.day === openingDay);

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
        setOpeningDay(day);
        setClosingDay(-1);
        setCurrentlyOpenedDay(day);
        setRegisteringActivity(true);
    }
    const closeRegisterActivityDialog = (event: React.MouseEvent<HTMLButtonElement>) => {
        setRegisteringActivity(false);
        setClosingDay(openingDay);
        // setTimeout(() => setClosingDay(-1), 400);
        setOpeningDay(-1);
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
                        PUT<ServerLogActivityResponse>('/log-activity', JSON.stringify(req))
                            .then(achievements => {
                                const unlocked = achievements.achievements.filter(a => a.unlocked);
                                if (unlocked.length > 0) {
                                    setUnlockedAchievements(unlocked);
                                    setTimeout(() => setUnlockedAchievements([]), 10000); // Clear achievements after 10 seconds
                                }
                                refreshCalendar(setAvailableActivities, setLoggedActivities)
                            })
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
                <tbody>
                    <tr>
                        {days.slice(0, 6).map(d => (<td key={d.toString()} className={getOpeningClosingClassName(d, openingDay, closingDay)}>{renderDay(d, openRegisterActivityDialog, loggedActivities)}</td>))}
                    </tr>
                    <tr>
                        {days.slice(6, 12).map(d => (<td key={d.toString()} className={getOpeningClosingClassName(d, openingDay, closingDay)}>{renderDay(d, openRegisterActivityDialog, loggedActivities)}</td>))}
                    </tr>
                    <tr>
                        {days.slice(12, 18).map(d => (<td key={d.toString()} className={getOpeningClosingClassName(d, openingDay, closingDay)}>{renderDay(d, openRegisterActivityDialog, loggedActivities)}</td>))}
                    </tr>
                    <tr>
                        {days.slice(18, 24).map(d => (<td key={d.toString()} className={getOpeningClosingClassName(d, openingDay, closingDay)}>{renderDay(d, openRegisterActivityDialog, loggedActivities)}</td>))}
                    </tr>
                </tbody>
            </table>
            <Dialog open={registeringActivity} onClose={closeRegisterActivityDialog}>
                <DialogTitle>Log activity</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Activities available to choose from today are:
                    </DialogContentText>
                    {CurrentDayActivities(currentlyOpenedDay, todayActivities, selectedActivityForRegistration, setSelectedActivityForRegistration)}
                    {
                        typeof alreadyLoggedActivityForOpening !== 'undefined' ?
                            <div>
                                Logged
                                {renderActivity(alreadyLoggedActivityForOpening.info.activity)}
                                {alreadyLoggedActivityForOpening.info.value}
                            </div>
                            :
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
                    }
                </DialogContent>
                <DialogActions>
                    <Button onClick={closeRegisterActivityDialog} id='cancel'>Cancel</Button>
                    <Button onClick={closeRegisterActivityDialog} id='register' disabled={!(validDistance && typeof todayActivities !== 'undefined' && todayActivities.length > 0) || typeof alreadyLoggedActivityForOpening !== 'undefined'}>Log</Button>
                </DialogActions>
            </Dialog>
            {
                unlockedAchievements.length > 0 ?
                    <div className="floating-achievement">
                        {unlockedAchievements.map((a, i) => renderAchievement(a, i))}
                    </div>
                    : ""
            }
        </div>
    );
}

function getOpeningClosingClassName(day: number, openingDay: number, closingDay: number): string {
    if (day === openingDay) {
        return "calendar-opening";
    } else if (day === closingDay) {
        return "calendar-closing";
    } else {
        return "";
    }
}

function CurrentDayActivities(dayOfDecZeroIndexed: number, todayActivities: ActivityInfo[] | undefined, selectedActivity: Activity, setSelectedActivity: (activity: Activity) => void): React.ReactFragment {
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
                    todayActivities.map(a => <ToggleButton value={a.activity}>{renderActivity(a.activity)} {a.value}</ToggleButton>)
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
                <IconButton color="primary" aria-label="open-day" onClick={locked ? clickedDay : () => openRegisterActivityDialog(day)} id={day.toString()}>
                    {locked ?
                        <LockIcon></LockIcon>
                        :
                        typeof loggedActivity !== 'undefined' ?
                            <div> {renderActivity(loggedActivity.activity)} {loggedActivity.value} </div>
                            :
                            <LockOpenIcon></LockOpenIcon>
                    }
                </IconButton>
                {day + 1}
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
    const dec1 = new Date('2022-12-01');
    const dec25 = new Date('2022-12-25');
    const today = new Date();
    if (today.getTime() < dec1.getTime()) {
        return -1;
    } else if (today.getTime() > dec25.getTime()) {
        return 23;
    } else {
        return today.getDate() - 1;
    }
}