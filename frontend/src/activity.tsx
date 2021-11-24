import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import { Activity } from './protocol';

export function renderActivity(activity: Activity): React.ReactFragment {
    switch (activity) {
        case 'BIKE': return <DirectionsBikeIcon/>;
        case 'RUN': return <DirectionsRunIcon/>;
    }
}