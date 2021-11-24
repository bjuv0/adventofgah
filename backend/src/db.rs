use std::str::FromStr;

use anyhow::Result;
use rand::seq::SliceRandom;
use rand::thread_rng;
use rusqlite::Connection;
use serde_derive::{Deserialize, Serialize};
use serde_rusqlite::*;
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

#[derive(Serialize, Deserialize, Copy, Clone, Debug, PartialEq)]
pub enum Activity {
    BIKE = 0,
    RUN = 1,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct ActivityInfo {
    activity: Activity,
    value: f64,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct LoggedActivityInfo {
    day: u8,
    info: ActivityInfo,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct Event {
    id: i32,
    distance: i32,
}

pub struct Db {
    conn: Connection,
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
                \"id\"	TEXT NOT NULL UNIQUE,
                \"username\"	TEXT NOT NULL,
                \"pass\"	TEXT NOT NULL,
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
            "CREATE TABLE IF NOT EXISTS \"EVENT\" (
                \"id\"	INTEGER NOT NULL,
                \"distance\"	INTEGER NOT NULL,
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

    pub fn get_available_activities(&self) -> Result<Vec<ActivityInfo>> {
        let today = 10;
        let mut query = self
            .conn
            .prepare("SELECT * FROM EVENT WHERE id <= (?)")
            .unwrap();
        let res = from_rows::<Event>(query.query([today]).unwrap());

        // hmm this could be more prettier, need to learn more rust :P
        let mut ret: Vec<ActivityInfo> = Vec::new();
        for e in res {
            ret.push(ActivityInfo {
                activity: Activity::RUN,
                value: e?.distance as f64,
            });
        }
        println!("{:?}", ret);
        Ok(ret)
    }

    pub fn get_logged_activities(&self, _user: Uuid) -> Result<Vec<LoggedActivityInfo>> {
        Ok(vec![LoggedActivityInfo {
            day: 4,
            info: ActivityInfo {
                activity: Activity::RUN,
                value: 4.0,
            },
        }])
    }
}
