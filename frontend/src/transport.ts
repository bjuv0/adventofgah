
import { ActivityInfo, LoggedActivityInfo, ServerCalendarResponse, } from './protocol';
import { getUserState } from './user';
// Implementation of network protocol here

const SERVER_BASE_URL = 'http://localhost:3000';


export function getLoggedActivityInfo(day: Date, loggedActivities: LoggedActivityInfo[]): ActivityInfo | undefined {
    for (const logged of loggedActivities) {
        if (logged.day === day.getDate()) {
            return logged.info;
        }
    }
    return undefined;
}

export async function getCalendarInfo(): Promise<ServerCalendarResponse> {
    // const req: ClientCalendarRequest = {
    //     get_available_activities: true,
    //     get_logged_activities: true,
    // };
    // return POST<ServerCalendarResponse>('/calendar', JSON.stringify(req));
    return GET<ServerCalendarResponse>('/calendar');
}


async function GET<T>(route: string): Promise<T> {
    return new Promise<T>(async (resolve, reject) => {
        const extra_headers = getExtraHeaders();
        try {
            const response = await fetch(SERVER_BASE_URL + route, { headers: { ...extra_headers } });

            const data = await response.json() as T;
            resolve(data);
        } catch (e) {
            console.error(`Failed to GET ${route}: ${e}`);
            reject(`Failed to GET ${route}: ${e}`);
        }
    });
}

export async function POST<T>(route: string, body: string): Promise<T> {
    return new Promise<T>(async (resolve, reject) => {
        const extra_headers = getExtraHeaders();
        try {
            const response = await fetch(SERVER_BASE_URL + route, {
                method: 'POST',
                body: body,
                headers: {
                    'Content-Type': 'application/json',
                    ...extra_headers,
                }
            });

            const data = await response.json() as T;
            resolve(data);
        } catch (e) {
            console.error(`Failed to POST ${route}: ${e}`);
            reject(`Failed to POST ${route}: ${e}`);
        }
    });
}

export async function PUT<T>(route: string, body: string): Promise<T> {
    return new Promise<T>(async (resolve, reject) => {
        const extra_headers = getExtraHeaders();
        try {
            const response = await fetch(SERVER_BASE_URL + route, {
                method: 'PUT',
                body: body,
                headers: {
                    'Content-Type': 'application/json',
                    ...extra_headers,
                }
            });

            const data = await response.json() as T;
            resolve(data);
        } catch (e) {
            console.error(`Failed to POST ${route}: ${e}`);
            reject(`Failed to POST ${route}: ${e}`);
        }
    });
}


function getExtraHeaders(): any {
    return typeof getUserState().session_key === 'undefined' ? {} : { 'Authentification': getUserState().session_key };
}