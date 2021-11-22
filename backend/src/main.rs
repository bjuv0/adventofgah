mod db;

use anyhow::Result;
use db::Db;
use hyper::{
    service::{make_service_fn, service_fn},
    Body, Request, Server, StatusCode,
};
use serde::Deserialize;

type Response = hyper::Response<hyper::Body>;

async fn add_user(body: Body) -> Result<Response> {
    #[derive(Deserialize, Debug)]
    struct Data {
        username: String,
        pass: String,
    }
    let bytes = hyper::body::to_bytes(body).await?;
    let data: Data = serde_json::from_slice(&bytes)?;
    let db = Db::new()?;
    db.add_user(&data.username, &data.pass)?;
    Ok(Response::new(Body::empty()))
}

async fn handle_request(req: Request<hyper::Body>) -> Result<Response> {
    if let Some(_auth) = req.headers().get("Authentification") {
        // Check session
        // fetch user
        Ok(Response::new(Body::empty()))
    } else {
        match req.uri().path() {
            "/register-user" => add_user(req.into_body()).await,
            _ => Ok(hyper::Response::builder()
                .status(StatusCode::NOT_FOUND)
                .body(format!("Unknown path: {}", req.uri().path()).into())
                .unwrap()),
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
