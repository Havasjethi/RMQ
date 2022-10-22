Time Table

- Szept 27 --- 25 perc

# RabbitMq

## Concept

It's AMQP 0.9.1
Advanced Message Queuing Protocol

Publisher <-> Broker <-> Consumer

Features:

- Message Acknowledgement (Networks are unreliable)
- Dead letter queue

### Basic Blocks (Slide)

- Message
- Publisher
- Exchange
- Binding
- Queue ; Stream
- Consumer

### Queue (Slide)

Itt gyülekeznek az üzenetek
SOR ban
Ezt olvashatja a Consumer

Adatok

- Név: Fixed Max 255 bytes of UTF-8 || Randomly named by Server
- Durability (boolean [persistent|transient]): Should it survive a restart <br> Metadata of a durable queue is stored on disk, while metadata of a transient queue is stored in memory when possible
- Arguments
  - TTL
  - Dead Letter Exchange; Routing key

### Exchange

- Ide jönnek be az üzenetek
- Feladatuk: Routing
  - Szétszórni a beérkező üzeneteket a Queue-k ba

Adatok

- Név, Durability, AutoDelete, Args

Types:

- ## Direct: messages to queues based on the message routing key
- Fanout: exchange routes messages to all of the queues that are bound to it and the routing key is ignored
  - Cél mindenki kapjon értesítést
- Topic: 0+ Queue-ba; Routing key alapján szorírozás
- Headers: routing on multiple Message Header attributes alapján; Routing key ignorálva

Extra:
Default Exchange || Direct Exchange with binding to every single queue

### Consumers (Slide)

two ways for applications to do this:

- Subscribe to have messages delivered to them ("push API"): this is the recommended option
- Polling ("pull API"): this way is highly inefficient and should be avoided in most cases

With the "push API", applications have to indicate interest in consuming messages from a particular queue. When they do so, we say that they register a consumer or, simply put, subscribe to a queue. It is possible to have more than one consumer per queue or to register an exclusive consumer (excludes all other consumers from the queue while it is consuming).

Each consumer (subscription) has an identifier called a consumer tag. It can be used to unsubscribe from messages. Consumer tags are just strings.

## Tooling

### Programming

#### TypeScript

#### Spring Integration

### Admin

### Rabbit:ctl

##### Links

- https://www.rabbitmq.com/tutorials/amqp-concepts.html
