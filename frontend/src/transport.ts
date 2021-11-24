
import { ActivityInfo, Activity } from './protocol';
// Implementation of network protocol here

const SERVER_BASE_URL = 'http://localhost:3000';


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


async function GET<T>(route: string): Promise<T> {
    try {
        const response = await fetch(SERVER_BASE_URL + route);

        const data = await response.json() as T;
        return Promise.resolve(data);
    } catch(e) {
        console.error("Failed to GET: ", e);
        return Promise.reject();
    }
}

export async function POST<T>(route: string, body: string): Promise<T> {
    try {
        const response = await fetch(SERVER_BASE_URL + route, {
            method: 'POST',
            body: body,
            headers: {
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json() as T;
        return Promise.resolve(data);
    } catch(e) {
        console.error("Failed to GET: ", e);
        return Promise.reject();
    }
}