import { Field, InputType, Int, ObjectType } from 'type-graphql';
import {
  IsEnum,
  IsOptional,
  IsUUID,
  Max,
  Min,
  Validate,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import {
  EDUCATIONAL_DEGREE,
  EDUCATIONAL_FIELD,
  GRADE_LEVEL,
} from '../_shared/const.enum';
import { SchoolCourseRO } from '../schoolCourse/schoolCourse.dto';
import { MultiplyTimes } from '../_shared/custom.decorators';
import { Type } from 'class-transformer';

// <editor-fold desc="YearStudyplanRO">
@ObjectType()
export class YearStudyplanRO {
  @Field()
  id: string;

  @Field(() => Date)
  created: Date;

  @Field(() => Date)
  updated: Date;

  @Field(() => Number)
  hoursPerWeek: number;

  @Field(() => Number, { nullable: true })
  extraHours: number;

  @Field(() => Boolean)
  makePair: boolean;

  @Field(() => Int)
  gradeLvl: number;

  @Field(() => SchoolCourseRO, { defaultValue: [] })
  schoolCourse: SchoolCourseRO;
}

// </editor-fold>

// <editor-fold desc="YearStudyplanUpdateDTO">
@InputType()
export class YearStudyplanUpdateDTO {
  @Field(() => String)
  @IsUUID('4')
  readonly id: string;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @Validate(MultiplyTimes)
  @Max(6)
  @ValidateIf(o => !o.extraHours || o.extraHours === 0)
  @Min(0.5)
  readonly hoursPerWeek?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @Max(5)
  @ValidateIf(o => !o.hoursPerWeek || o.hoursPerWeek === 0)
  @Min(0.5)
  readonly extraHours?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsEnum(GRADE_LEVEL)
  readonly gradeLvl?: number;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  readonly makePair?: boolean;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID('4')
  readonly schoolCourse?: string;
}

// </editor-fold>

// <editor-fold desc="YearStudyplanDTO">
@InputType()
export class YearStudyplanDTO {
  @Field(() => Number)
  @Max(6)
  @ValidateIf(o => !o.extraHours)
  @Min(0.5)
  @Validate(MultiplyTimes)
  readonly hoursPerWeek: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @Min(0.5)
  @Max(5)
  readonly extraHours: number;

  @Field(() => Number)
  @IsEnum(GRADE_LEVEL)
  readonly gradeLvl: number;

  @Field(() => Boolean)
  readonly makePair: boolean;

  @Field()
  @IsUUID('4')
  readonly schoolCourse: string;

  @Field()
  @IsUUID('4')
  readonly yearTimetable: string;
}

// </editor-fold>

// <editor-fold desc="YearStudyplanFilterDTO">
@InputType()
export class YearStudyplanFilterDTO {
  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsEnum(EDUCATIONAL_FIELD)
  readonly educationalField?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsEnum(EDUCATIONAL_DEGREE)
  readonly educationalDegree?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsEnum(GRADE_LEVEL)
  readonly gradeLvl?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsUUID('4')
  readonly yearTimetableId?: string;
}

// </editor-fold>

// <editor-fold desc="YearStudyplanFilterDTO">
@InputType()
export class YearStudyplanRemoveDTO {
  @Field(() => [String])
  @ValidateNested({ each: true })
  @Type(() => String)
  readonly yearStudyplan: string[];
}
// </editor-fold>
