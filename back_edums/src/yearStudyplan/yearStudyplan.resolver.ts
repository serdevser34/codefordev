import { Args, Mutation, Query, Resolver } from '@nestjs/graphql';
import {
  YearStudyplanDTO,
  YearStudyplanFilterDTO,
  YearStudyplanRemoveDTO,
  YearStudyplanRO,
  YearStudyplanUpdateDTO,
} from './yearStudyplan.dto';
import { YearStudyplanService } from './yearStudyplan.service';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../_shared/auth.guard';
import { ROLES } from '../_shared/const.enum';

@Resolver(() => YearStudyplanRO)
export class YearStudyplanResolver {
  // <editor-fold desc="common + constructor">
  constructor(private yearStudyplanService: YearStudyplanService) {}

  // </editor-fold>

  // <editor-fold desc="yearStudyplans() [School] graphql">
  @Query(() => [YearStudyplanRO])
  @UseGuards(new AuthGuard([ROLES.SCHOOL]))
  async yearStudyplans(
    @Args('filter') filter: YearStudyplanFilterDTO,
  ): Promise<YearStudyplanRO[]> {
    return this.yearStudyplanService.showByFilters(filter);
  }

  // </editor-fold>

  // <editor-fold desc="createYearStudyplans [School] graphql">
  @Mutation(() => YearStudyplanRO)
  @UseGuards(new AuthGuard([ROLES.SCHOOL]))
  async createYearStudyplans(
    @Args('data') data: YearStudyplanDTO,
  ): Promise<YearStudyplanRO> {
    return this.yearStudyplanService.createYearStudyplan(data);
  }

  // </editor-fold>

  // <editor-fold desc="updateYearStudyplans [School] graphql">
  @Mutation(() => YearStudyplanRO)
  @UseGuards(new AuthGuard([ROLES.SCHOOL]))
  async updateYearStudyplans(
    @Args('data') data: YearStudyplanUpdateDTO,
  ): Promise<YearStudyplanRO> {
    return this.yearStudyplanService.updateYearStudyplan(data);
  }

  // </editor-fold>

  // <editor-fold desc="removeYearStudyplans [School] graphql">
  @Mutation(() => [YearStudyplanRO])
  @UseGuards(new AuthGuard([ROLES.SCHOOL]))
  async removeYearStudyplans(
    @Args('data') data: YearStudyplanRemoveDTO,
  ): Promise<YearStudyplanRO[]> {
    return this.yearStudyplanService.removeYearStudyplans(data);
  }

  // </editor-fold>
}
