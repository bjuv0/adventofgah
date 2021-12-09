

// Used for PUT /register-user
export type ClientRegisterUserRequest = UsernamePass;
export type ServerRegisterUserResponse = SessionKeyResponse;

// Used for POST /login
export type ClientLoginRequest = UsernamePass;
export type ServerLoginResponse = SessionKeyResponse;

// Used for /leaderboard
// export type ClientLeaderboardRequest = Range;
export type ServerLeaderboardResponse = LeaderboardInfo;

// Used for GET /calendar
export type ClientCalendarRequest = CalendarGetRequest;
export type ServerCalendarResponse = CalendarResponse;

// Used for /log-activity
export type ClientLogActivityRequest = LoggedActivityInfo; // No response except HTTP 200

// Used for /achievements
export type ServerAchievementsResponse = Achievements;

// Routes
export type GetRoutes = '/calendar' | '/leaderboard' | '/achievements';


// Type definitions below

interface UsernamePass {
    username: string;
    pass: string;
}

interface SessionKeyResponse {
    session_key: string;
}

export interface LeaderboardDetail {
    username: string;
    points: number;
    bike_dst: number;   // Total bike distance
    run_dst: number;    // Total run distance
    walk_dst: number;   // Total walk distance
    ski_dst: number;    // Total ski distance
    bronze_achievements: number;
    silver_achievements: number;
    gold_achievements: number;
    diamond_achievements: number;
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

export type AchievementRank = 'BRONZE' | 'SILVER' | 'GOLD' | 'DIAMOND';

export interface Achievement {
    title: string;
    description: string;
    unlocked: boolean;
    rank: AchievementRank;
}

export interface Achievements {
    total: number;
    unlocked: number;
    achievements: Achievement[]
}
