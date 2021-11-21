import { IconButton, Paper } from "@mui/material";
import LockClockIcon from '@mui/icons-material/LockClock';

export function renderCalendar(): React.ReactFragment {
    const days = [];
    for (let i = 1; i <= 24; i++) {
        days.push(new Date(`2021-12-${i}`));
    }
    return (
        <div>
            { 
                days.map(d => (
                    <div>
                        { renderDay(d) }
                        <br />
                    </div>
                    ))
            }
        </div>
    );
}

function renderDay(day: Date): React.ReactFragment {
    return (
        <div className="calendar-day">
            <Paper elevation={10} >
                <IconButton color="primary" aria-label="open-day" onClick={clickedDay} id={day.toISOString()}>
                    <LockClockIcon></LockClockIcon>
                </IconButton>
                {day.toDateString()}
            </Paper>
        </div>
    );
}

function clickedDay(event: React.MouseEvent<HTMLButtonElement>) {
    alert(`Clicked with event: ${event.currentTarget.id}`);
}