import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TablesController } from './tables.controller';
import { TablesService } from './tables.service';
import { CafeTable } from './entities/table.entity';
import { TableStatus } from './entities/table-status.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CafeTable, TableStatus])],
  controllers: [TablesController],
  providers: [TablesService],
  exports: [TablesService],
})
export class TablesModule {}
