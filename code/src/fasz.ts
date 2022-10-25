// import * as amqplib from 'amqplib';
// // const amqplib = require('amqplib/callback_api');
// console.log(amqplib);
// (async () => {
// const queue = 'test';

const connDetai = {
  hostname: 'localhost',
  username: 'rabbitmq',
  password: 'rabbitmq',
  vhost: '/vhost',
  port: 5672,
};
// const conn = await amqplib.connect(connDetai);

// const ch1 = await conn.createChannel();
// await ch1.assertQueue(queue);

// // Listener
// ch1.consume(queue, (msg: any) => {
// if (msg !== null) {
// console.log('Recieved:', msg.content.toString());
// ch1.ack(msg);
// } else {
// console.log('Consumer cancelled by server');
// }
// ch1.ack(msg);
// });

// // Sender
// const ch2 = await conn.createChannel();

// setInterval(() => {
// ch1.sendToQueue(queue, Buffer.from('something to do'));
// console.log('Redva fos: ', ch2.sendToQueue(queue, Buffer.from('something to do')));
// console.log('Redva fos: ', ch2.publish('', queue, Buffer.from('something to do')));
// }, 1000);
// })();

var amqp = require('amqplib/callback_api');

amqp.connect(connDetai, function (error0, connection) {
  if (error0) {
    throw error0;
  }
  connection.createChannel(function (error1, channel) {
    if (error1) {
      throw error1;
    }

    var queue = 'hello';
    var msg = 'Hello World!';

    channel.assertQueue(queue, {
      durable: false,
    });
    channel.sendToQueue(queue, Buffer.from(msg));
    channel.sendToQueue(queue, Buffer.from(msg));
    channel.sendToQueue(queue, Buffer.from(msg));
    channel.sendToQueue(queue, Buffer.from(msg));
    channel.sendToQueue(queue, Buffer.from(msg));

    console.log(' [x] Sent %s', msg);
  });
  setTimeout(function () {
    connection.close();
    process.exit(0);
  }, 1500);
});
