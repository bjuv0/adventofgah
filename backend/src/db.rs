use std::str::FromStr;

use anyhow::Result;
use rand::seq::SliceRandom;
use rand::thread_rng;
use rusqlite::Connection;
use serde_derive::{Deserialize, Serialize};
use serde_rusqlite::*;
use strum::IntoEnumIterator;
use strum_macros::EnumIter;
use uuid::Uuid;

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
    run_dst: f64,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct LeaderBoardInfo {
    total_entries: usize,
    start_of_range: usize,
    details: Vec<LeaderboardDetail>,
}

#[derive(Serialize, Deserialize, Copy, Clone, Debug, PartialEq, EnumIter)]
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

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct ActivityRecord {
    user: String,
    event_id: i32,
    activity: Activity,
    score: f64,
    distance: f64,
}

pub struct Db {
    conn: Connection,
}

pub fn today() -> i32 {
    10
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

    pub fn get_leaderboard(&self) -> Result<LeaderBoardInfo> {
        Ok(LeaderBoardInfo {
            total_entries: 2,
            start_of_range: 0,
            details: vec![
                LeaderboardDetail {
                    username: String::from("foo"),
                    points: 26.0,
                    bike_dst: 30.0,
                    run_dst: 46.0,
                },
                LeaderboardDetail {
                    username: String::from("bar"),
                    points: 35.0,
                    bike_dst: 10.0,
                    run_dst: 50.0,
                },
            ],
        })
    }

    pub fn get_available_activities(&self) -> Result<Vec<Vec<ActivityInfo>>> {
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
        let mut query = self
            .conn
            .prepare("SELECT * FROM ACTIVITYRECORD WHERE user = (?)")
            .unwrap();
        let res = from_rows::<ActivityRecord>(query.query([user.to_string()]).unwrap());
        let mut activities: Vec<LoggedActivityInfo> = Vec::new();
        for a in res {
            let a = a?;
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
        if day > today() {
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
}
