import { createSelector } from 'reselect';
import { initialState } from 'containers/LoginPage/reducer';

const selectLoginPageDomain = (state) => state.login || initialState;

const makeInitialValuesSelector = () =>
  createSelector(selectLoginPageDomain, (substate) => substate.initialValues);

const makeFormValuesSelector = () =>
  createSelector(selectLoginPageDomain, (substate) => substate.formValues);

const makeErrorSelector = () =>
  createSelector(selectLoginPageDomain, (substate) => substate.errors);

const makeIsLoadingSelector = () =>
  createSelector(selectLoginPageDomain, (substate) => substate.isLoading);

const makeSelectLoginPage = () =>
  createSelector(selectLoginPageDomain, (substate) => substate);

export default makeSelectLoginPage;

export {
  makeInitialValuesSelector,
  makeFormValuesSelector,
  makeErrorSelector,
  makeIsLoadingSelector,
};
