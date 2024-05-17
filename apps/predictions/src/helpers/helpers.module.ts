import { Module } from '@nestjs/common';
import { HelpersService } from './helpers.service';

@Module({
  providers: [HelpersService]
})
export class HelpersModule {}
