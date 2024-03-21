import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';
import { StorageService } from '@app/common';
import { EventsService } from '../events/events.service';

describe('UsersService', () => {
  let service: UsersService;
  let mockUsersRepository: Partial<UsersRepository>;
  let mockStorageService: StorageService;
  let eventsService: Partial<EventsService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UsersService],
    }).compile();

    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
