

// Used for /register-user
export type ClientRegisterUserRequest = UsernamePass;
export type ServerRegisterUserResponse = SessionKeyResponse;

// Used for /login
export type ClientLoginRequest = UsernamePass;
export type ServerLoginResponse = SessionKeyResponse;

// Used for /leaderboard
export type ClientLeaderboardRequest = Range;
export type ServerLeaderboardResponse = LeaderboardInfo;

// Used for /calendar
export type ClientCalendarRequest = CalendarGetRequest;
export type ServerCalendarResponse = CalendarResponse;

// Used for /log-activity
export type ClientLogActivityRequest = ActivityPutRequest; // No response except HTTP 200


// Type definitions below

interface UsernamePass {
    username: string;
    pass: string;
}

interface SessionKeyResponse {
    session_key: string;
}

interface LeaderboardDetail {
    username: string;
    points: number;
    bike_dst: number;   // Total bike distance
    run_dst: number;    // Total run/walk distance
}

interface LeaderboardInfo {
    total_entries: number;
    start_of_range: number; // Used for partial leader boards with "next page"
    details: LeaderboardDetail[];
}

interface Range {
    start: number;
    end?: number;
}

export enum Activity {
    BIKE,
    RUN,

}

export interface ActivityInfo {
    activity: Activity;
    value: number;
}

export interface LoggedActivityInfo {
    day: string;    // UTC string
    info: ActivityInfo;
}

interface CalendarGetRequest {
    get_available_activities: boolean;  // If true in request, response should contain "CalendarResponse.available_activities"
    get_logged_activities: boolean;     // If true in request, response should contain "CalendarResponse.logged_activities"
}

interface ActivityPutRequest {
    log_activity?: LoggedActivityInfo;  // If present, should be saved in the DB
}

interface CalendarResponse {
    available_activities?: ActivityInfo[];
    logged_activities?: ActivityInfo[];
}