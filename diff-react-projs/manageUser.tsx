import React, { useContext } from 'react';
import styles from './manageUser.module.scss';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Home } from '@blueprintjs/icons';
import classNames from 'classnames';
import ManageUserForm from '@/components/forms/manageUserForm/manageUserForm';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { observer } from 'mobx-react-lite';
import usersStore from '@/store/usersStore';
import { ProgressSpinner } from 'primereact/progressspinner';
import { PlainUserInfo } from '@/types/user';
import useFetch from '@/hooks/useFetch';
import ToastContext from '@/context/toast';

const ManageUser: React.FC = observer(() => {
  const { t } = useTranslation();
  const { showError } = useContext(ToastContext);
  const { id } = useParams();

  const { data: initialValues, isLoading } = useFetch<PlainUserInfo>(
    () =>
      id
        ? usersStore.getPlainUserInfo(parseInt(id)) // if id is defined, get user info (Update mode)
        : Promise.resolve({ data: {} as PlainUserInfo, error: '' }), // else, return empty object (Add mode)
    [id],
    { onError: showError },
  );

  return (
    <div className={styles.manageUser}>
      <h3 className={classNames('heading heading-3', styles.heading)}>
        {id && initialValues ? t('clients.edit') : t('clients.add')}
      </h3>
      <BreadCrumb
        home={{ icon: <Home color='gray' />, url: '/' }}
        model={[
          { label: t('clients.clients'), url: '/users' },
          {
            label:
              id && initialValues ? `${initialValues.id}` : t('clients.add'),
            url: '/users/add',
          },
        ]}
      />
      <div className={styles.formContainer}>
        {isLoading ? (
          <ProgressSpinner />
        ) : (
          <ManageUserForm
            initialValues={id ? initialValues ?? undefined : undefined}
          />
        )}
      </div>
    </div>
  );
});

export default ManageUser;
