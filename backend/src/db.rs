use std::{collections::HashMap, str::FromStr};

use anyhow::Result;
use chrono::NaiveDate;
use rand::seq::SliceRandom;
use rand::thread_rng;
use rusqlite::Connection;
use serde_derive::{Deserialize, Serialize};
use serde_rusqlite::*;
use strum::IntoEnumIterator;
use strum_macros::EnumIter;
use uuid::Uuid;

use crate::achievements::{get_achievements, AchievementRank, AchievementType};

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct User {
    id: String,
    username: String,
    pass: String,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct Session {
    id: String,
    key: String,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct LeaderboardDetail {
    username: String,
    points: f64,
    bike_dst: f64,
    walk_dst: f64,
    run_dst: f64,
    ski_dst: f64,
    bronze_achievements: i32,
    silver_achievements: i32,
    gold_achievements: i32,
    diamond_achievements: i32,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct LeaderBoardInfo {
    total_entries: usize,
    start_of_range: usize,
    details: Vec<LeaderboardDetail>,
}

#[derive(Serialize, Deserialize, Copy, Clone, Debug, PartialEq, EnumIter, Hash, Eq)]
pub enum Activity {
    BIKE = 0,
    RUN = 1,
    WALK = 2,
    SKI = 3,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct ActivityInfo {
    activity: Activity,
    value: f64,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct LoggedActivityInfo {
    day: i32,
    info: ActivityInfo,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct Event {
    id: i32,
    distance: i32,
}

#[derive(Serialize, Deserialize, Debug, PartialEq, Clone)]
pub struct ActivityRecord {
    user: String,
    event_id: i32,
    activity: Activity,
    score: f64,
    distance: f64,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct Achievements {
    total: i32,
    unlocked: i32,
    achievements: Vec<Achievement>,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct Achievement {
    title: String,
    description: String,
    unlocked: bool,
    rank: AchievementRank,
}

pub struct Db {
    conn: Connection,
}

fn today_unsafe() -> i32 {
    let start = NaiveDate::from_ymd(2021, 12, 1).and_hms(0, 0, 0);
    chrono::offset::Local::now()
        .naive_local()
        .signed_duration_since(start)
        .num_days() as i32
}

pub fn today() -> i32 {
    today_unsafe().max(0).min(23) as i32
}

fn not_yet_started() -> bool {
    today_unsafe() < 0
}

fn multiplier(act: Activity) -> i32 {
    match act {
        Activity::BIKE => 3,
        Activity::RUN => 1,
        Activity::SKI => 2,
        Activity::WALK => 1,
    }
}

fn get_daily_available(dist: i32) -> Vec<ActivityInfo> {
    let mut vec: Vec<ActivityInfo> = Vec::new();
    for activity in Activity::iter() {
        vec.push(ActivityInfo {
            activity,
            value: (dist * multiplier(activity)) as f64,
        })
    }
    vec
}

impl Db {
    pub fn new() -> Result<Self> {
        // Super ineffecient to create new conn all the time but the conn won't clone :/
        // And not expecting any super load on the server :Ps

        let conn = Connection::open("db")?;

        Ok(Self { conn })
    }

    pub fn init(&self) -> Result<()> {
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS \"USERS\" (
                \"id\" TEXT NOT NULL UNIQUE,
                \"username\" TEXT NOT NULL,
                \"pass\" TEXT NOT NULL,
                PRIMARY KEY(\"id\")
            );",
            [],
        )?;
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS \"SESSION\" (
            \"id\"	TEXT NOT NULL UNIQUE,
            \"key\"	TEXT NOT NULL,
            PRIMARY KEY(\"id\")
        );",
            [],
        )?;
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS \"ACTIVITYRECORD\" (
                \"user\" TEXT NOT NULL,
                \"event_id\" INTEGER NOT NULL,
                \"activity\" INTEGER NOT NULL,
                \"score\" REAL NOT NULL,
                \"distance\" REAL NOT NULL
            );",
            [],
        )?;
        self.conn.execute(
            "CREATE TABLE IF NOT EXISTS \"EVENT\" (
                \"id\" INTEGER NOT NULL,
                \"distance\" INTEGER NOT NULL,
                PRIMARY KEY(\"id\")
            );",
            [],
        )?;
        let mut query = self.conn.prepare("SELECT * FROM EVENT").unwrap();
        let res = from_rows::<Event>(query.query([]).unwrap());

        if res.count() == 0 {
            let mut distances = vec![3; 4];
            let mut d4 = vec![4; 5];
            let mut d5 = vec![5; 6];
            let mut d6 = vec![6; 5];
            let mut d7 = vec![7; 4];
            distances.append(&mut d4);
            distances.append(&mut d5);
            distances.append(&mut d6);
            distances.append(&mut d7);
            distances.shuffle(&mut thread_rng());

            let mut day = 0;
            for distance in distances {
                let event = Event { id: day, distance };
                day += 1;
                self.conn
                    .execute(
                        "INSERT INTO EVENT (id, distance) VALUES (:id, :distance)",
                        to_params_named(&event).unwrap().to_slice().as_slice(),
                    )
                    .unwrap();
            }
        }

        Ok(())
    }

    pub fn add_user(&self, username: &str, pass: &str) -> Result<()> {
        let mut query = self
            .conn
            .prepare("SELECT * FROM USERS WHERE username = (?)")
            .unwrap();
        let res = from_rows::<User>(query.query([username]).unwrap());

        if res.count() > 0 {
            return Err(anyhow::anyhow!("User alread registered"));
        }

        let user = User {
            id: Uuid::new_v4().to_string(),
            username: username.to_string(),
            pass: pass.to_string(),
        };

        self.conn
            .execute(
                "INSERT INTO USERS (id, username, pass) VALUES (:id, :username, :pass)",
                to_params_named(&user).unwrap().to_slice().as_slice(),
            )
            .unwrap();

        Ok(())
    }

    pub fn get_user_id(&self, username: &str, pass: &str) -> Result<Uuid> {
        let mut query = self
            .conn
            .prepare("SELECT * FROM USERS WHERE username = (?) AND pass = (?)")
            .unwrap();
        let mut res = from_rows::<User>(query.query([username, pass]).unwrap());
        if let Some(data) = res.next() {
            return Ok(Uuid::from_str(&data?.id)?);
        }
        Err(anyhow::anyhow!("User pass incorrect"))
    }

    pub fn get_user_name(&self, id: &String) -> Result<String> {
        let mut query = self
            .conn
            .prepare("SELECT * FROM USERS WHERE id = (?)")
            .unwrap();
        let mut res = from_rows::<User>(query.query([id]).unwrap());
        if let Some(data) = res.next() {
            return Ok(data?.username);
        }
        Err(anyhow::anyhow!("Could not find user"))
    }

    pub fn get_session_key(&self, user: Uuid, create_if_missing: bool) -> Result<String> {
        let mut query = self
            .conn
            .prepare("SELECT * FROM SESSION WHERE id = (?)")
            .unwrap();
        let res = from_rows::<Session>(query.query([user.to_string()]).unwrap());
        for session in res {
            return Ok(session?.key);
        }

        if create_if_missing {
            let session = Session {
                id: user.to_string(),
                key: Uuid::new_v4().to_string(),
            };
            self.conn
                .execute(
                    "INSERT INTO SESSION (id, key) VALUES (:id, :key)",
                    to_params_named(&session).unwrap().to_slice().as_slice(),
                )
                .unwrap();
            return Ok(session.key);
        }

        Err(anyhow::anyhow!("Session is missing"))
    }

    pub fn get_user_from_session(&self, key: String) -> Result<Uuid> {
        let mut query = self
            .conn
            .prepare("SELECT * FROM SESSION WHERE key = (?)")
            .unwrap();
        let res = from_rows::<Session>(query.query([key]).unwrap());
        for session in res {
            return Ok(Uuid::from_str(&session?.id)?);
        }
        Err(anyhow::anyhow!("Could not find user"))
    }

    fn get_user_leaderboard_distances_and_score(&self, user: String) -> Result<LeaderboardDetail> {
        let mut details = LeaderboardDetail {
            username: self.get_user_name(&user)?,
            points: 0.0,
            bike_dst: 0.0,
            walk_dst: 0.0,
            run_dst: 0.0,
            ski_dst: 0.0,
            bronze_achievements: 0,
            silver_achievements: 0,
            gold_achievements: 0,
            diamond_achievements: 0,
        };

        let mut query = self
            .conn
            .prepare("SELECT * FROM ACTIVITYRECORD WHERE user = (?)")
            .unwrap();
        let res = from_rows::<ActivityRecord>(query.query([user]).unwrap());
        for activity in res {
            let activity = activity?;
            match activity.activity {
                Activity::BIKE => details.bike_dst += activity.distance,
                Activity::RUN => details.run_dst += activity.distance,
                Activity::WALK => details.walk_dst += activity.distance,
                Activity::SKI => details.ski_dst += activity.distance,
            }
            details.points += activity.score;
        }
        Ok(details)
    }

    fn get_user_leaderboard_entry(&self, user: String) -> Result<LeaderboardDetail> {
        let mut entry = self.get_user_leaderboard_distances_and_score(user.clone())?;
        let achievements = self.get_acheivements(Uuid::from_str(&user)?)?;
        for achievement in achievements.achievements {
            if achievement.unlocked {
                match achievement.rank {
                    AchievementRank::Bronze => entry.bronze_achievements += 1,
                    AchievementRank::Silver => entry.silver_achievements += 1,
                    AchievementRank::Gold => entry.gold_achievements += 1,
                    AchievementRank::Diamond => entry.diamond_achievements += 1,
                }
            }
        }
        Ok(entry)
    }

    pub fn get_leaderboard(&self) -> Result<LeaderBoardInfo> {
        let mut board: Vec<LeaderboardDetail> = Vec::new();

        let mut query = self.conn.prepare("SELECT * FROM USERS").unwrap();
        let res = from_rows::<User>(query.query([]).unwrap());

        for user in res {
            board.push(self.get_user_leaderboard_entry(user?.id)?)
        }

        Ok(LeaderBoardInfo {
            total_entries: board.len(),
            start_of_range: 0,
            details: board,
        })
    }

    pub fn get_available_activities(&self) -> Result<Vec<Vec<ActivityInfo>>> {
        if not_yet_started() {
            return Ok(vec![vec![]]);
        }
        let mut query = self
            .conn
            .prepare("SELECT * FROM EVENT WHERE id <= (?)")
            .unwrap();
        let res = from_rows::<Event>(query.query([today()]).unwrap());

        // hmm this could be more prettier, need to learn more rust :P
        let mut ret: Vec<Vec<ActivityInfo>> = Vec::new();
        for e in res {
            ret.push(get_daily_available(e?.distance));
        }

        Ok(ret)
    }

    pub fn get_daily_event(&self, day: i32) -> Result<Event> {
        let mut query = self
            .conn
            .prepare("SELECT * FROM EVENT WHERE id <= (?)")
            .unwrap();
        let res = from_rows::<Event>(query.query([day]).unwrap());
        for e in res {
            return Ok(e?);
        }
        Err(anyhow::anyhow!("Already registered"))
    }

    pub fn get_logged_activities(&self, user: Uuid) -> Result<Vec<LoggedActivityInfo>> {
        let db_activities = self.user_activities(user)?;

        let mut activities: Vec<LoggedActivityInfo> = Vec::new();
        for a in db_activities {
            activities.push(LoggedActivityInfo {
                day: a.event_id,
                info: ActivityInfo {
                    activity: a.activity,
                    value: a.distance,
                },
            });
        }
        Ok(activities)
    }

    pub fn add_activity(&self, user: Uuid, day: i32, info: ActivityInfo) -> Result<()> {
        if day < 0 || day > 23 {
            return Err(anyhow::anyhow!(format!("Bad input day: {}", day)));
        }

        if not_yet_started() || day > today() {
            return Err(anyhow::anyhow!("Can not set activities in the future"));
        }

        let mut query = self
            .conn
            .prepare("SELECT * FROM ACTIVITYRECORD WHERE event_id = (?) AND user = (?)")
            .unwrap();
        let res = from_rows::<Event>(
            query
                .query(serde_rusqlite::to_params(&(day, user.to_string())).unwrap())
                .unwrap(),
        );

        if res.count() > 0 {
            return Err(anyhow::anyhow!("Already registered"));
        }

        let event_of_the_day = self.get_daily_event(day)?;

        let covered_dist = info.value.max(0.0);

        let mut score = 10.0 * (covered_dist / multiplier(info.activity) as f64)
            / event_of_the_day.distance as f64;
        score = score.min(10.0);

        if day != today() {
            score /= 2.0;
        }

        let record = ActivityRecord {
            user: user.to_string(),
            event_id: day,
            activity: info.activity,
            score,
            distance: covered_dist,
        };

        self.conn
            .execute(
                "INSERT INTO ACTIVITYRECORD (user, event_id, activity, score, distance) VALUES (:user, :event_id, :activity, :score, :distance)",
                to_params_named(&record).unwrap().to_slice().as_slice(),
            )
            .unwrap();

        Ok(())
    }

    fn user_activities(&self, user: Uuid) -> Result<Vec<ActivityRecord>> {
        let mut query = self
            .conn
            .prepare("SELECT * FROM ACTIVITYRECORD WHERE user = (?)")
            .unwrap();
        let res = from_rows::<ActivityRecord>(query.query([user.to_string()]).unwrap());
        let mut activities: Vec<ActivityRecord> = Vec::new();
        for activity in res {
            activities.push(activity?);
        }
        Ok(activities)
    }

    pub fn get_acheivements(&self, user: Uuid) -> Result<Achievements> {
        let mut activities = self.user_activities(user)?;
        activities.sort_by_key(|activity| activity.event_id);
        let lb = self.get_user_leaderboard_distances_and_score(user.to_string())?;
        let mut activity_counts = HashMap::new();
        let mut streaks = HashMap::new();
        let mut streak_count = 1;
        let mut last_day: Option<ActivityRecord> = None;
        for activity in activities {
            let count = activity_counts.entry(activity.activity).or_insert(0);
            *count += 1;

            if let Some(yesterday) = last_day {
                streak_count = if yesterday.activity == activity.activity
                    && yesterday.event_id == activity.event_id - 1
                {
                    streak_count + 1
                } else {
                    1
                }
            }

            last_day = Some(activity.clone());

            let streak = streaks.entry(activity.activity).or_insert(0);
            *streak = *streak.max(&mut streak_count);
        }

        let all_achievemnts = get_achievements();

        let mut achievements = Achievements {
            total: all_achievemnts.len() as i32,
            unlocked: 0,
            achievements: Vec::new(),
        };

        for achievement in all_achievemnts {
            let unlocked = match achievement.achievement_type {
                AchievementType::Streak(times, activity) => {
                    *streaks.entry(activity).or_default() >= times
                }
                AchievementType::UnlockType(types) => activity_counts.len() >= types,
                AchievementType::ActivityCount(times, activity) => {
                    *activity_counts.entry(activity).or_default() >= times
                }
                AchievementType::Distance(distance, activity) => match activity {
                    Activity::BIKE => lb.bike_dst >= distance,
                    Activity::SKI => lb.ski_dst >= distance,
                    Activity::RUN => lb.run_dst >= distance,
                    Activity::WALK => lb.run_dst >= distance,
                },
            };

            if unlocked {
                achievements.unlocked += 1;
            }

            achievements.achievements.push(Achievement {
                title: achievement.title,
                description: achievement.description,
                unlocked,
                rank: achievement.rank,
            })
        }

        Ok(achievements)
    }
}
