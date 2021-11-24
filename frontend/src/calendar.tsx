import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, IconButton, Paper, TextField, ToggleButton, ToggleButtonGroup } from "@mui/material";
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import React from "react";
import { Activity, ActivityInfo } from "./protocol";
import { getAvailableActivities, getLoggedActivityInfo } from "./transport";
import { renderActivity } from "./activity";

export function Calendar() {
    const [registeringActivity, setRegisteringActivity] = React.useState(false);
    const [currentlyOpenedDay, setCurrentlyOpenedDay] = React.useState(0);

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
                { days.slice(0, 8).map(d => (<td>{renderDay(d, openRegisterActivityDialog)}</td>)) }
            </tr>
            <tr>
                { days.slice(8, 16).map(d => (<td>{renderDay(d, openRegisterActivityDialog)}</td>)) }
            </tr>
            <tr>
                { days.slice(16, 24).map(d => (<td>{renderDay(d, openRegisterActivityDialog)}</td>)) }
            </tr>
        </table>
        <Dialog open={registeringActivity} onClose={closeRegisterActivityDialog}>
            <DialogTitle>Register activity</DialogTitle>
            <DialogContent>
            <DialogContentText>
                Activities available to choose from today are:
            </DialogContentText>
            { CurrentDayActivities(currentlyOpenedDay) }
            </DialogContent>
            <DialogActions>
            <Button onClick={closeRegisterActivityDialog}>Cancel</Button>
            <Button onClick={closeRegisterActivityDialog}>Select</Button>
            </DialogActions>
        </Dialog>
        </div>
    );
}

function CurrentDayActivities(dayOfDec: number): React.ReactFragment {
    const availableActivities: ActivityInfo[] = getAvailableActivities(dayOfDec);
    const [selectedActivity, setSelectedActivity] = React.useState(Activity[availableActivities[0].activity])

    const handleChangedActivity = (event: any, newActivity: string) => {
        setSelectedActivity(newActivity);
    }

    return (
        <ToggleButtonGroup
            color="primary"
            value={selectedActivity}
            exclusive
            onChange={handleChangedActivity}
            >
            { availableActivities.map(a => {
                const asString = Activity[a.activity];
                return <ToggleButton value={asString}>{renderActivity(a.activity)} { a.value }</ToggleButton>;
            }) }
        </ToggleButtonGroup>
    );
}

function renderDay(day: Date, openRegisterActivityDialog: (day: Date) => void): React.ReactFragment {
    const locked: boolean = isLocked(day);
    const loggedActivity = getLoggedActivityInfo(day);
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