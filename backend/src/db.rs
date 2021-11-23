use std::str::FromStr;

use anyhow::Result;
use rusqlite::Connection;
use serde_derive::{Deserialize, Serialize};
use serde_rusqlite::*;
use uuid::Uuid;

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct User {
    id: String,
    name: String,
    pass: String,
}

#[derive(Serialize, Deserialize, Debug, PartialEq)]
pub struct Session {
    id: String,
    key: String,
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
                \"name\"	TEXT NOT NULL,
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
        Ok(())
    }

    pub fn add_user(&self, name: &str, pass: &str) -> Result<()> {
        let mut query = self
            .conn
            .prepare("SELECT * FROM USERS WHERE name = (?)")
            .unwrap();
        let res = from_rows::<User>(query.query([name]).unwrap());

        if res.count() > 0 {
            return Err(anyhow::anyhow!("User alread registered"));
        }

        let user = User {
            id: Uuid::new_v4().to_string(),
            name: name.to_string(),
            pass: pass.to_string(),
        };

        self.conn
            .execute(
                "INSERT INTO USERS (id, name, pass) VALUES (:id, :name, :pass)",
                to_params_named(&user).unwrap().to_slice().as_slice(),
            )
            .unwrap();

        Ok(())
    }

    pub fn get_user_id(&self, name: &str, pass: &str) -> Result<Uuid> {
        let mut query = self
            .conn
            .prepare("SELECT * FROM USERS WHERE name = (?) AND pass = (?)")
            .unwrap();
        let mut res = from_rows::<User>(query.query([name, pass]).unwrap());
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
                key: String::from("asdfasad"),
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
}
