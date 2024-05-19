import { PubSub, Subscription, Topic } from '@google-cloud/pubsub';
import { Inject, Injectable } from '@nestjs/common';
import {
  PercentageResult,
  PredictionResult,
  PredictionResultDto,
} from '../common';

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
    return new Promise<PredictionResultDto[]>((resolve, reject) => {
      const receivedMessages = [];

      const handleMessage = (message: any) => {
        console.log('Received message data:', message.data.toString());

        receivedMessages.push(message.data.toString());

        console.log('message count:', receivedMessages.length);
        console.log(receivedMessages.length === numMessages);

        message.ack();

        if (receivedMessages.length == numMessages) {
          subscription.removeListener('message', handleMessage);

          let predictionsResultDto: (any | PredictionResultDto)[] = Array.from(
            { length: numMessages },
            () => undefined,
          );

          receivedMessages.forEach((receivedMessage) => {
            const predictionResultDtoObj = JSON.parse(
              receivedMessage,
            ) as PredictionResultDto;
            predictionsResultDto[predictionResultDtoObj.index] =
              predictionResultDtoObj;
          });

          resolve(predictionsResultDto);
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
