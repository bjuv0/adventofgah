
import { ActivityInfo, Activity } from './protocol';
// Implementation of network protocol here



export function getLoggedActivityInfo(day: Date): ActivityInfo | undefined {
    // TODO actually read from server
    if (day.getDate() === 1) {
        return { activity: Activity.BIKE, value: 15 };
    } else {
        return undefined;
    }
}

export function getAvailableActivities(dayOfDec: number): ActivityInfo[] {
    // TODO, for now always just return same list
    return [
        { activity: Activity.BIKE, value: 15 },
        { activity: Activity.RUN, value: 5 },
    ];
}