import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';
import DirectionsWalkIcon from '@mui/icons-material/DirectionsWalk';
import DownhillSkiingIcon from '@mui/icons-material/DownhillSkiing';
import { Activity } from './protocol';

export function renderActivity(activity: Activity): React.ReactFragment {
    switch (activity) {
        case 'BIKE': return <DirectionsBikeIcon/>;
        case 'RUN': return <DirectionsRunIcon/>;
        case 'WALK': return <DirectionsWalkIcon/>;
        case 'SKI': return <DownhillSkiingIcon/>;
    }
}