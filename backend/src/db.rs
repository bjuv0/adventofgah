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
                \"Name\"	TEXT NOT NULL,
                \"Pass\"	TEXT NOT NULL,
                PRIMARY KEY(\"id\")
            );",
            [],
        )?;
        Ok(())
    }

    pub fn add_user(&self, name: &str, pass: &str) -> Result<()> {
        // deserializing using query() and from_rows(), the most efficient way
        let mut query = self
            .conn
            .prepare("SELECT * FROM USERS WHERE Name =  (?)")
            .unwrap();
        let res = from_rows::<User>(query.query([name]).unwrap());
        if res.count() > 0 {
            anyhow::anyhow!("User alread registered");
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
}
