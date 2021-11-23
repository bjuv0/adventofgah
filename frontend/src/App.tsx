import './App.css';
import { renderCalendar } from './calendar';
import { createTheme, ThemeProvider } from '@mui/material';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import { renderUserBar } from './user';

function App() {
  const darkTheme = createTheme({
    palette: {
      mode: 'dark',
    },
  });

  return (
    <div className="App">
      <ThemeProvider theme={darkTheme}>
        <header className="App-header">
          <span className="App-span-header" >
            <AcUnitIcon fontSize="large" />
            Advent of Gah
          </span>
          <div>
            <br />
            { renderCalendar() }
          </div>
          { renderUserBar() }
        </header>
      </ThemeProvider>
    </div>
  );
}

export default App;
