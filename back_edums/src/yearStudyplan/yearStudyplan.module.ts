import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { YearStudyplanEntity } from './yearStudyplan.entity';
import { YearTimetableEntity } from '../yearTimetable/yearTimetable.entity';
import { SchoolCourseEntity } from '../schoolCourse/schoolCourse.entity';
import { YearStudyplanService } from './yearStudyplan.service';
import { YearStudyplanResolver } from './yearStudyplan.resolver';
import { YearTimetableService } from '../yearTimetable/yearTimetable.service';
import { SchoolCourseService } from '../schoolCourse/schoolCourse.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      YearStudyplanEntity,
      YearTimetableEntity,
      SchoolCourseEntity,
    ]),
  ],
  providers: [
    YearStudyplanService,
    YearStudyplanResolver,
    YearTimetableService,
    SchoolCourseService,
  ],
})
export class YearStudyplanModule {}
