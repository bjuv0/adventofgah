

// Used for PUT /register-user
export type ClientRegisterUserRequest = UsernamePass;
export type ServerRegisterUserResponse = SessionKeyResponse;

// Used for POST /login
export type ClientLoginRequest = UsernamePass;
export type ServerLoginResponse = SessionKeyResponse;

// Used for /leaderboard
export type ClientLeaderboardRequest = Range;
export type ServerLeaderboardResponse = LeaderboardInfo;

// Used for GET /calendar
export type ClientCalendarRequest = CalendarGetRequest;
export type ServerCalendarResponse = CalendarResponse;

// Used for /log-activity
export type ClientLogActivityRequest = LoggedActivityInfo; // No response except HTTP 200


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

export type Activity = 'BIKE' | 'RUN' | 'WALK' | 'SKI';

export interface ActivityInfo {
    activity: Activity;
    value: number;
}

export interface LoggedActivityInfo {
    day: number;    // day of dec 0-23
    info: ActivityInfo;
}

interface CalendarGetRequest {
    get_available_activities: boolean;  // If true in request, response should contain "CalendarResponse.available_activities"
    get_logged_activities: boolean;     // If true in request, response should contain "CalendarResponse.logged_activities"
}

interface CalendarResponse {
    available_activities?: Array<ActivityInfo[]>;
    logged_activities?: LoggedActivityInfo[];
}