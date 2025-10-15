use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::{TcpListener, TcpStream};
use tokio::sync::{broadcast, Mutex};
use tokio::task::JoinHandle;
use tokio_tungstenite::{accept_async, tungstenite::Message};
use futures_util::{SinkExt, StreamExt};

pub struct ProfilerServer {
    tx: broadcast::Sender<String>,
    port: u16,
    shutdown_tx: Arc<Mutex<Option<tokio::sync::oneshot::Sender<()>>>>,
    task_handle: Arc<Mutex<Option<JoinHandle<()>>>>,
}

impl ProfilerServer {
    pub fn new(port: u16) -> Self {
        let (tx, _) = broadcast::channel(100);
        Self {
            tx,
            port,
            shutdown_tx: Arc::new(Mutex::new(None)),
            task_handle: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn start(&self) -> Result<(), Box<dyn std::error::Error>> {
        let addr = format!("127.0.0.1:{}", self.port);
        let listener = TcpListener::bind(&addr).await?;
        println!("[ProfilerServer] Listening on: {}", addr);

        let tx = self.tx.clone();
        let (shutdown_tx, mut shutdown_rx) = tokio::sync::oneshot::channel();

        // 存储 shutdown sender
        *self.shutdown_tx.lock().await = Some(shutdown_tx);

        // 启动服务器任务
        let task = tokio::spawn(async move {
            loop {
                tokio::select! {
                    // 监听新连接
                    result = listener.accept() => {
                        match result {
                            Ok((stream, peer_addr)) => {
                                println!("[ProfilerServer] New connection from: {}", peer_addr);
                                let tx = tx.clone();
                                tokio::spawn(handle_connection(stream, peer_addr, tx));
                            }
                            Err(e) => {
                                eprintln!("[ProfilerServer] Failed to accept connection: {}", e);
                            }
                        }
                    }
                    // 监听关闭信号
                    _ = &mut shutdown_rx => {
                        println!("[ProfilerServer] Received shutdown signal");
                        break;
                    }
                }
            }
            println!("[ProfilerServer] Server task ending");
        });

        // 存储任务句柄
        *self.task_handle.lock().await = Some(task);

        Ok(())
    }

    pub async fn stop(&self) {
        println!("[ProfilerServer] Stopping server...");

        // 发送关闭信号
        if let Some(shutdown_tx) = self.shutdown_tx.lock().await.take() {
            let _ = shutdown_tx.send(());
        }

        // 等待任务完成
        if let Some(handle) = self.task_handle.lock().await.take() {
            let _ = handle.await;
        }

        println!("[ProfilerServer] Server stopped");
    }

    pub fn broadcast(&self, message: String) {
        let _ = self.tx.send(message);
    }
}

async fn handle_connection(
    stream: TcpStream,
    peer_addr: SocketAddr,
    tx: broadcast::Sender<String>,
) {
    let ws_stream = match accept_async(stream).await {
        Ok(ws) => ws,
        Err(e) => {
            eprintln!("[ProfilerServer] WebSocket error: {}", e);
            return;
        }
    };

    let (mut ws_sender, mut ws_receiver) = ws_stream.split();
    let mut rx = tx.subscribe();

    println!("[ProfilerServer] Client {} connected", peer_addr);

    // Send initial connection confirmation
    let _ = ws_sender
        .send(Message::Text(
            serde_json::json!({
                "type": "connected",
                "message": "Connected to ECS Editor Profiler"
            })
            .to_string(),
        ))
        .await;

    // Spawn task to forward broadcast messages to this client
    let forward_task = tokio::spawn(async move {
        while let Ok(msg) = rx.recv().await {
            if ws_sender.send(Message::Text(msg)).await.is_err() {
                break;
            }
        }
    });

    // Handle incoming messages from client
    while let Some(msg) = ws_receiver.next().await {
        match msg {
            Ok(Message::Text(text)) => {
                // Parse incoming debug data from game client
                if let Ok(json_value) = serde_json::from_str::<serde_json::Value>(&text) {
                    if json_value.get("type").and_then(|t| t.as_str()) == Some("debug_data") {
                        // Broadcast to frontend (ProfilerWindow)
                        tx.send(text).ok();
                    } else if json_value.get("type").and_then(|t| t.as_str()) == Some("ping") {
                        // Respond to ping
                        let _ = tx.send(
                            serde_json::json!({
                                "type": "pong",
                                "timestamp": chrono::Utc::now().timestamp_millis()
                            })
                            .to_string(),
                        );
                    }
                }
            }
            Ok(Message::Close(_)) => {
                println!("[ProfilerServer] Client {} disconnected", peer_addr);
                break;
            }
            Ok(Message::Ping(data)) => {
                // Respond to WebSocket ping
                tx.send(
                    serde_json::json!({
                        "type": "pong",
                        "data": String::from_utf8_lossy(&data)
                    })
                    .to_string(),
                )
                .ok();
            }
            Err(e) => {
                eprintln!("[ProfilerServer] Error: {}", e);
                break;
            }
            _ => {}
        }
    }

    forward_task.abort();
    println!("[ProfilerServer] Connection handler ended for {}", peer_addr);
}
