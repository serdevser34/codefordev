import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { YearTimetableEntity } from '../yearTimetable/yearTimetable.entity';
import { SchoolCourseEntity } from '../schoolCourse/schoolCourse.entity';
import { WorkloadEntity } from '../workload/workload.entity';
import { GRADE_LEVEL } from '../_shared/const.enum';

@Entity('yearStudyplan')
@Unique(['yearTimetable', 'schoolCourse', 'gradeLvl'])
export class YearStudyplanEntity {
  // <editor-fold desc="Fields">
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  created: Date;

  @UpdateDateColumn()
  updated: Date;

  @Column('float')
  hoursPerWeek: number;

  @Column('boolean', { default: false })
  makePair: boolean;

  @Column({
    type: 'float',
    nullable: true,
  })
  extraHours: number;

  @Column({
    type: 'enum',
    enum: GRADE_LEVEL,
  })
  gradeLvl: GRADE_LEVEL;
  // </editor-fold>

  // <editor-fold desc="Relations fields">
  @ManyToOne(
    () => YearTimetableEntity,
    yearTimetable => yearTimetable.yearStudyplan,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn()
  yearTimetable: YearTimetableEntity;

  @ManyToOne(
    () => SchoolCourseEntity,
    schoolCourse => schoolCourse.yearStudyplan,
    { onDelete: 'CASCADE' },
  )
  @JoinColumn()
  schoolCourse: SchoolCourseEntity;

  @OneToMany(
    () => WorkloadEntity,
    workload => workload.yearStudyplan,
    { onDelete: 'CASCADE' },
  )
  workload: WorkloadEntity;

  // </editor-fold>
}
