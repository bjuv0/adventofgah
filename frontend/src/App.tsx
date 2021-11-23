import './App.css';
import { Calendar } from './calendar';
import { createTheme, ThemeProvider } from '@mui/material';
import AcUnitIcon from '@mui/icons-material/AcUnit';
import { UserBar } from './user';

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
            <Calendar />
          </div>
          <UserBar />
        </header>
      </ThemeProvider>
    </div>
  );
}

export default App;
