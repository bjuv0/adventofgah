mod db;

use anyhow::Result;
use db::Db;
use hyper::{
    service::{make_service_fn, service_fn},
    Body, Request, Server, StatusCode,
};
use serde::Deserialize;
use serde_json::json;
use serde_json::Value;

type Response = hyper::Response<hyper::Body>;

fn ok_json(data: Value) -> Result<Response> {
    Ok(Response::new(Body::from(serde_json::to_vec(&data)?)))
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

async fn handle_request(req: Request<hyper::Body>) -> Result<Response> {
    if let Some(auth) = req.headers().get("Authentification") {
        let db = Db::new()?;
        let user = db.get_user_from_session(auth.to_str()?.into())?;
        println!("Succesful request by {:?}", user);
        Ok(Response::new(Body::empty()))
    } else {
        match req.uri().path() {
            "/register-user" => reg_login(req.into_body(), true).await,
            "/login" => reg_login(req.into_body(), false).await,
            _ => Ok(nok_reason(format!("Unknown path: {}", req.uri().path()))),
        }
    }
}

#[tokio::main]
async fn main() {
    let db = Db::new().expect("Db craete failed");
    db.init().expect("Db init failed");

    let new_service = make_service_fn(move |_| async {
        Ok::<_, anyhow::Error>(service_fn(move |req| handle_request(req)))
    });

    let addr = "0.0.0.0:8080".parse().expect("adr failed");
    let server = Server::bind(&addr).serve(new_service);
    println!("Listening on http://{}", addr);
    let _ = server.await;
}
