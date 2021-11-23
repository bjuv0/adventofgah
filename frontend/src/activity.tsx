import DirectionsBikeIcon from '@mui/icons-material/DirectionsBike';
import DirectionsRunIcon from '@mui/icons-material/DirectionsRun';

export enum Activity {
    BIKE,
    RUN,

}

export function renderActivity(activity: Activity): React.ReactFragment {
    switch (activity) {
        case Activity.BIKE: return <DirectionsBikeIcon/>;
        case Activity.RUN: return <DirectionsRunIcon/>;
    }
}