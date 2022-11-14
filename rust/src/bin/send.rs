use std::sync::Arc;
use std::sync::Mutex;
use std::{
    ops::Add,
    time::{Duration, Instant},
};
use tokio::task::JoinHandle;

use futures::StreamExt;
use lapin::{
    options::*,
    types::FieldTable,
    uri::{AMQPAuthority, AMQPScheme, AMQPUri, AMQPUserInfo},
    BasicProperties, Channel, Connection, ConnectionProperties,
};

static TARGET_QUEUE: &'static str = "hello";

#[derive(Debug)]
struct ConnectionHandler {
    connection: Connection,
    channel_pool: Vec<Channel>,
    handles: Vec<JoinHandle<()>>,
    pool_size: u32,
    next_index: Mutex<usize>,
}

impl ConnectionHandler {
    pub fn new(c: Connection) -> Self {
        ConnectionHandler {
            connection: c,
            channel_pool: Vec::new(),
            handles: Vec::new(),
            pool_size: 20,
            next_index: Mutex::new(0),
        }
    }

    pub async fn fill_pool(&mut self) -> () {
        // let x: Vec<Box<dyn Future<Output = lapin::Result<Channel>>>> = (0..self.pool_size)
        // .map(|e| Box::new(self.connection.create_channel()))
        // .collect();

        for _ in 0..self.pool_size {
            let channel = self.connection.create_channel().await.unwrap();
            self.channel_pool.push(channel);
        }
    }

    fn get_next_number(&self) -> usize {
        let mut lock = self.next_index.lock().unwrap();
        *lock = (*lock + 1) % self.channel_pool.len();
        return *lock;
    }

    pub async fn get_channel(&self) -> &Channel {
        let n = self.get_next_number();
        if let Some(reference) = self.channel_pool.get(n) {
            reference
        } else {
            dbg!(
                "This is N:::",
                n,
                "This is max size: ",
                &self.channel_pool.len()
            );
            panic!("Whatta??")
        }
    }
}

#[derive(Debug)]
struct Measurement {
    sent_messages: Mutex<u32>,
    max_pending: u32,
}

impl Measurement {
    pub fn increment(&self) {
        let mut lock = self.sent_messages.lock().unwrap();
        *lock += 1;
    }
}

impl ConnectionHandler {
    pub async fn connect() -> Result<Self, lapin::Error> {
        let addr = "amqp://127.0.0.1:5672";
        let x: AMQPUri = AMQPUri {
            authority: AMQPAuthority {
                host: "0.0.0.0".into(),
                port: 5672,
                userinfo: AMQPUserInfo {
                    username: "guest".into(),
                    password: "guest".into(),
                },
            },
            vhost: "/vhost".to_owned(),
            scheme: AMQPScheme::AMQP,
            ..Default::default()
        };

        Ok(ConnectionHandler::new(
            Connection::connect(addr, ConnectionProperties::default()).await?,
        ))
    }

    async fn receive_message(&mut self) -> () {
        let channel = self.connection.create_channel().await.unwrap();
        let mut consumer = channel
            .basic_consume(
                TARGET_QUEUE,
                "consumer",
                BasicConsumeOptions::default(),
                FieldTable::default(),
            )
            .await
            .expect("basic_consume");

        // println!(" [*] Waiting for messages. To exit press CTRL+C");

        let handle = tokio::spawn(async move {
            while let Some(delivery) = consumer.next().await {
                if let Ok(delivery) = delivery {
                    // println!(" [x] Received {:?}", std::str::from_utf8(&delivery.data));
                    delivery
                        .ack(BasicAckOptions::default())
                        .await
                        .expect("basic_ack");
                }
            }
        });
        self.handles.push(handle);
    }

    async fn declare_queue(&mut self) -> lapin::Queue {
        self.connection
            .create_channel()
            .await
            .unwrap()
            .queue_declare(
                "hello",
                QueueDeclareOptions::default(),
                FieldTable::default(),
            )
            .await
            .unwrap()
    }
}

type SenderStuff = tokio::sync::mpsc::Sender<()>;
async fn send_messages(ch: &Arc<ConnectionHandler>, data: &Arc<SenderStuff>) -> () {
    let count = ch.pool_size;
    let mut res: Vec<JoinHandle<()>> = Vec::new();

    for _ in 0..count {
        let handler_copy = ch.clone();
        let data_copy = data.clone();

        let x = tokio::spawn(async move { send_message(handler_copy, &data_copy).await });
        res.push(x);
    }

    futures::future::join_all(res).await;
}

async fn send_message(ch: Arc<ConnectionHandler>, data: &Arc<SenderStuff>) -> () {
    let channel = ch.get_channel().await;

    let payload = b"asdasd";

    channel
        .basic_publish(
            "",
            TARGET_QUEUE,
            BasicPublishOptions::default(),
            payload,
            BasicProperties::default(),
        )
        .await
        .unwrap();
    data.send(()).await.unwrap();
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    let mut producer = ConnectionHandler::connect().await?;
    let (tx, mut rx) = tokio::sync::mpsc::channel::<()>(1_000);

    producer.fill_pool().await;
    let shared_tx = Arc::new(tx);

    let send_message_receiver = tokio::spawn(async move {
        let mut total = 0;
        while rx.recv().await.is_some() {
            total += 1;
        }
        return total;
    });

    let shared_producer = Arc::new(producer);

    send_test(shared_producer, shared_tx).await;

    println!(
        "Total send messages: {:?}",
        send_message_receiver.await.unwrap()
    );

    Ok(())
}

async fn send_test(shared_producer: Arc<ConnectionHandler>, shared_tx: Arc<SenderStuff>) {
    let final_time = Instant::now().add(Duration::from_secs(5));
    while Instant::now() < final_time {
        send_messages(&shared_producer, &shared_tx).await;
    }
}
