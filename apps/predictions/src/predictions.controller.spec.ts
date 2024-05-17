import { Test, TestingModule } from '@nestjs/testing';
import { PredictionsController } from './predictions.controller';
import { PredictionsService } from './predictions.service';

describe('PredictionsController', () => {
  let predictionsController: PredictionsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PredictionsController],
      providers: [PredictionsService],
    }).compile();

    predictionsController = app.get<PredictionsController>(PredictionsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(predictionsController.getHello()).toBe('Hello World!');
    });
  });
});
