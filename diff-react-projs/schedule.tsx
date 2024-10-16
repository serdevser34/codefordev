import useFetch from '@/hooks/useFetch';
import ordersStore from '@/store/ordersStore';
import { useMemo, useState } from 'react';
import { Event } from 'react-big-calendar';
import Flex from '@/components/UI/layout/flex';
import styles from './schedule.module.scss';
import { useTranslation } from 'react-i18next';
import { observer } from 'mobx-react-lite';
import organizationStore from '@/store/organizationsStore';
import { formatObjectIn } from '@/utils/formatters/formatObject';
import { Organization } from '@/models/Organization';
import objectsStore from '@/store/objectsStore';
import { RentalObject } from '@/models/RentalObject';
import { collectAllReservations, createEventsFromReservations } from './helper';
import { EventButton } from '@/components/calendarComponents/eventButton/eventButton';
import { Calendar } from '@/components/calendarComponents/customCalendar/customCalendar';
import { Events, ObjOption, OrgOption } from '@/types/schedule';
import { DropdownChangeEvent } from 'primereact/dropdown';
import Button from '@/components/UI/buttons/button';
import { useNavigate } from 'react-router-dom';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { Plus } from '@blueprintjs/icons';

const Schedule = observer(() => {
  const { t, i18n } = useTranslation();
  const [currentEventType, setCurrentEventType] = useState<Events>(
    Events.Organizations,
  );
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [currentObj, setCurrentObj] = useState<RentalObject | null>(null);
  const [event, setEvents] = useState<Event[] | null>(null);
  const navigate = useNavigate();
  const isLaptop = useMediaQuery('(max-width: 1350px)');

  const { data: organizations } = useFetch(
    () => organizationStore.getOrganizations(),
    [currentEventType],
    { disabled: currentEventType !== Events.Organizations },
  );

  const orgOptions: OrgOption[] | undefined = useMemo(() => {
    return organizations?.map((org) => ({
      label: org.name,
      organization: formatObjectIn(org, i18n.language),
    }));
  }, [organizations]);

  const { data: objects } = useFetch(
    () =>
      objectsStore.getRentalObjects({ limit: 1000, skip: 0 }, currentOrg?.id),
    [currentOrg],
    { disabled: currentOrg === null },
  );

  const objOptions: ObjOption[] | undefined = useMemo(() => {
    return objects?.map((obj) => ({
      label: obj.name,
      object: formatObjectIn(obj, i18n.language),
    }));
  }, [objects]);

  useFetch(
    () =>
      ordersStore.getOrders(
        { limit: 1000, skip: 0 },
        { rentalObjectId: currentObj?.id },
      ),
    [currentObj],
    {
      disabled: currentObj === null,
      onSuccess: (orders) => {
        const objectReservations = collectAllReservations(orders || []);
        const events: Event[] =
          createEventsFromReservations(objectReservations);

        setEvents(events);
      },
    },
  );

  useFetch(() => ordersStore.getOrdersWithTrainers(), [currentEventType], {
    disabled: currentEventType !== Events.Trainers,
    onSuccess: (orders) => {
      const trainerReservations = collectAllReservations(orders || []);
      const events: Event[] = createEventsFromReservations(trainerReservations);

      setEvents(events);
    },
  });

  const handleEventChange = (event: Events) => {
    setCurrentEventType(event);
    setCurrentObj(null);
    setCurrentOrg(null);
    setEvents(null);
  };

  const handleOrgChange = (e: DropdownChangeEvent) => {
    setCurrentOrg(e.target.value.organization);
    setCurrentObj(null);
    setEvents(null);
  };

  const handleObjChange = (e: DropdownChangeEvent) =>
    setCurrentObj(e.target.value.object);

  return (
    <Flex options={{ direction: 'column', gap: 2 }} className={styles.body}>
      <Flex options={{ align: 'center', gap: 2, justify: 'space-between' }}>
        <Flex options={{ gap: 1 }}>
          {Object.values(Events).map((event) => {
            return (
              <EventButton
                key={event}
                text={t(`schedule.events.${event}`)}
                value={event}
                isActive={currentEventType === event}
                onClick={() => handleEventChange(event)}
              />
            );
          })}
        </Flex>

        {isLaptop && (
          <Button icon={<Plus color='white' />} onClick={() => navigate('add')}>
            {t('schedule.addReservation')}
          </Button>
        )}
      </Flex>

      <Calendar
        orgUtils={{
          onOrgChange: handleOrgChange,
          orgOptions,
          orgName: currentOrg?.name,
        }}
        objUtils={{
          onObjChange: handleObjChange,
          objOptions,
          objectName: currentObj?.name,
        }}
        currentEvent={currentEventType}
        events={event}
      />
    </Flex>
  );
});

export default Schedule;
