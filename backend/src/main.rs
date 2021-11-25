mod db;

use anyhow::Result;
use db::Db;
use hyper::{
    service::{make_service_fn, service_fn},
    Body, Method, Request, Server, StatusCode,
};
use serde::Deserialize;
use serde_json::json;
use serde_json::Value;
use uuid::Uuid;

type Response = hyper::Response<hyper::Body>;

fn ok_json(data: Value) -> Result<Response> {
    Ok(Response::new(Body::from(serde_json::to_vec(&data)?)))
}

fn ok_string(data: String) -> Result<Response> {
    Ok(Response::new(Body::from(data)))
}

fn nok_reason(msg: String) -> Response {
    hyper::Response::builder()
        .status(StatusCode::NOT_FOUND)
        .body(msg.into())
        .unwrap()
}

async fn reg_login(body: Body, add_user: bool) -> Result<Response> {
    #[derive(Deserialize, Debug)]
    struct RegLoginData {
        username: String,
        pass: String,
    }

    let bytes = hyper::body::to_bytes(body).await?;
    let data: RegLoginData = serde_json::from_slice(&bytes)?;
    let db = Db::new()?;
    if add_user {
        db.add_user(&data.username, &data.pass)?;
    }
    let user = db.get_user_id(&data.username, &data.pass)?;
    let key = db.get_session_key(user, add_user)?;
    Ok(ok_json(json!({ "session_key": key }))?)
}

fn wrong_method(req: Request<hyper::Body>) -> Result<Response> {
    Ok(nok_reason(format!(
        "Wrong method: {} for path {}",
        req.method(),
        req.uri().path()
    )))
}

async fn add_activity(db: Db, user: Uuid, body: Body) -> Result<Response> {
    #[derive(Deserialize, Debug)]

    struct ActivityPutData {
        day: i32,
        info: db::ActivityInfo,
    }

    let bytes = hyper::body::to_bytes(body).await?;
    let data: ActivityPutData = serde_json::from_slice(&bytes)?;
    db.add_activity(user, data.day, data.info)?;
    Ok(Response::new(Body::empty()))
}

fn unknown_path(req: Request<hyper::Body>) -> Result<Response> {
    Ok(nok_reason(format!("Unknown path: {}", req.uri().path())))
}

async fn handle_request(req: Request<hyper::Body>) -> Result<Response> {
    if let Some(auth) = req.headers().get("Authentification") {
        let db = Db::new()?;
        let user = db.get_user_from_session(auth.to_str()?.into())?;
        match req.method().to_owned() {
            Method::PUT => match req.uri().path() {
                "/log-activity" => add_activity(db, user, req.into_body()).await,
                _ => unknown_path(req),
            },
            Method::GET => match req.uri().path() {
                "/leaderboard" => {
                    let lb = db.get_leaderboard()?;
                    ok_string(serde_json::to_string(&lb)?)
                }
                "/calendar" => {
                    let aa = db.get_available_activities()?;
                    let la = db.get_logged_activities(user)?;
                    let data = json!({"available_activities" : aa, "logged_activities" : la});
                    ok_json(data)
                }
                "/today" => ok_json(json!({ "day": db::today() })),
                _ => unknown_path(req),
            },
            _ => Ok(nok_reason(format!("Method {} not allowed", req.method()))),
        }
    } else {
        match req.uri().path() {
            "/register-user" => match req.method().to_owned() {
                Method::PUT => reg_login(req.into_body(), true).await,
                _ => wrong_method(req),
            },
            "/login" => match req.method().to_owned() {
                Method::POST => reg_login(req.into_body(), false).await,
                _ => wrong_method(req),
            },
            _ => unknown_path(req),
        }
    }
}

async fn try_handle_request(req: Request<hyper::Body>) -> Result<Response> {
    println!("Got request {:?}", req);
    match handle_request(req).await {
        Ok(resp) => {
            println!("Sending response {:?}", resp);
            Ok(resp)
        }
        Err(e) => {
            println!("{:?}", e);
            Err(e)
        }
    }
}

#[tokio::main]
async fn main() {
    let db = Db::new().expect("Db craete failed");
    db.init().expect("Db init failed");

    let new_service = make_service_fn(move |_| async {
        Ok::<_, anyhow::Error>(service_fn(move |req| try_handle_request(req)))
    });

    let addr = "0.0.0.0:8080".parse().expect("adr failed");
    let server = Server::bind(&addr).serve(new_service);
    println!("Listening on http://{}", addr);
    let _ = server.await;
}
