import { Test, TestingModule } from '@nestjs/testing';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';

describe('PatientsController', () => {
  let patientsController: PatientsController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [PatientsController],
      providers: [PatientsService],
    }).compile();

    patientsController = app.get<PatientsController>(PatientsController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(patientsController.getHello()).toBe('Hello World!');
    });
  });
});
