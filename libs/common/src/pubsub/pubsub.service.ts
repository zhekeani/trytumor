import { PubSub, Subscription, Topic } from '@google-cloud/pubsub';
import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class PubsubService {
  constructor(@Inject('PUBSUB') private readonly pubsubClient: PubSub) {}

  async createTopicIfNotExists(topicName: string) {
    const [topic] = await this.pubsubClient
      .topic(topicName)
      .get({ autoCreate: true });
    return topic;
  }

  async createSubscriptionIfNotExists(topic: Topic, subscriptionName: string) {
    const [subscription] = await topic
      .subscription(subscriptionName)
      .get({ autoCreate: true });
    return subscription;
  }

  async listenForMessages(subscription: Subscription, numMessages: number) {
    return new Promise<string[]>((resolve, reject) => {
      const receivedMessages = [];

      const handleMessage = (message: any) => {
        console.log('Received message data:', message.data.toString());

        receivedMessages.push(message.data.toString());

        console.log('message count:', receivedMessages.length);
        console.log(receivedMessages.length === numMessages);

        message.ack();

        if (receivedMessages.length == numMessages) {
          subscription.removeListener('message', handleMessage);

          resolve(receivedMessages);
        }
      };

      console.log('Start listening for message');
      subscription.on('message', handleMessage);

      subscription.on('error', (error) => {
        console.error('Subscription error:', error);
        reject(error);
      });
    });
  }
}
