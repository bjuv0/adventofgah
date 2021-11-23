import { IconButton, Paper } from "@mui/material";
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import { Activity, renderActivity } from "./activity";

export function renderCalendar(): React.ReactFragment {
    const days = [];
    for (let i = 1; i <= 24; i++) {
        days.push(new Date(`2021-12-${i}`));
    }
    return (
        <table>
            <tr>
                { days.slice(0, 8).map(d => (<td>{renderDay(d)}</td>)) }
            </tr>
            <tr>
                { days.slice(8, 16).map(d => (<td>{renderDay(d)}</td>)) }
            </tr>
            <tr>
                { days.slice(16, 24).map(d => (<td>{renderDay(d)}</td>)) }
            </tr>
        </table>
    );
}

function renderDay(day: Date): React.ReactFragment {
    const locked: boolean = isLocked(day);
    const loggedActivity = getLoggedActivityInfo(day);
    return (
        <div className="calendar-day">
            <Paper elevation={10} >
                <IconButton color="primary" aria-label="open-day" onClick={clickedDay} id={day.toISOString()}>
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

interface ActivityInfo {
    activity: Activity;
    value: number;
}

function getLoggedActivityInfo(day: Date): ActivityInfo | undefined {
    // TODO actually read from server
    if (day.getDate() === 1) {
        return { activity: Activity.BIKE, value: 15 };
    } else {
        return undefined;
    }
}