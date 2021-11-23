import './App.css';
import { Calendar } from './calendar';
import { createTheme, ThemeProvider, ToggleButton, ToggleButtonGroup } from '@mui/material';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import { UserBar } from './user';
import React from 'react';
import { Leaderboard } from './leaderboard';

function App() {
  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

  const [selectedPage, setSelectedPage] = React.useState("calendar");

  const handleChangePage = (event: any, newPage: string) => {
    setSelectedPage(newPage);
  }

  return (
    <div className="App">
      <ThemeProvider theme={darkTheme}>
        <header className="App-header">
          <span className="App-span-header" >
            <AcUnitIcon fontSize="large" />
            Advent of Gah
          </span>
          <div>
            <ToggleButtonGroup color="primary" value={selectedPage} exclusive onChange={handleChangePage} >
                <ToggleButton value="calendar">Calendar</ToggleButton>
                <ToggleButton value="leaderboard">Leaderboard</ToggleButton>
            </ToggleButtonGroup>
            <br />
            { selectedPage === 'calendar' ?
                <Calendar />
              :
                <Leaderboard />
            }
          </div>
          <UserBar />
        </header>
      </ThemeProvider>
    </div>
  );
}

export default App;
