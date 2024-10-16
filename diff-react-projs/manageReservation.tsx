import Flex from '@/components/UI/layout/flex';
import styles from './manageReservation.module.scss';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Home } from '@blueprintjs/icons';
import ordersStore from '@/store/ordersStore';
import useFetch from '@/hooks/useFetch';
import { observer } from 'mobx-react-lite';
import { ProgressSpinner } from 'primereact/progressspinner';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useContext } from 'react';
import ToastContext from '@/context/toast';
import ManageReservationForm from '@/components/forms/manageReservationForms/manageReservationForm';

const ManageReservation = observer(() => {
  const { t } = useTranslation();
  const { id } = useParams();
  const { showError } = useContext(ToastContext);
  const { data: order, isLoading } = useFetch(
    () =>
      id
        ? ordersStore.getOrderById(parseInt(id || '0'))
        : Promise.resolve({ data: null, error: '' }),
    [id],
    {
      onError(err) {
        showError(err);
        navigate('/schedule');
      },
    },
  );
  const navigate = useNavigate();

  return (
    <Flex options={{ direction: 'column', gap: 2 }} className={styles.pageBody}>
      <Flex options={{ direction: 'column', gap: 0.625 }}>
        <h3 className='heading heading-3'>
          {id ? t('schedule.editReservation') : t('schedule.addReservation')}
        </h3>
        <BreadCrumb
          home={{ icon: <Home color='gray' />, url: '/' }}
          model={[
            { label: t('schedule.schedule'), url: '/schedule' },
            {
              label: id || t('schedule.addReservation'),
              disabled: true,
            },
          ]}
        />
        <div className={styles.formContainer}>
          {isLoading ? (
            <ProgressSpinner />
          ) : (
            <ManageReservationForm initialOrder={order} />
          )}
        </div>
      </Flex>
    </Flex>
  );
});

export default ManageReservation;
