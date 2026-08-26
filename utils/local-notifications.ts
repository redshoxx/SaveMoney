import * as Notifications from 'expo-notifications';

export type ReminderKind = 'todo' | 'goal' | 'challenge';

export type ScheduledSparFlowReminder = {
  notificationId: string;
  kind: ReminderKind;
  sourceId: string;
  scheduledFor: string;
  title: string;
};

const CHANNEL_ID = 'sparflow-reminders';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function configureLocalNotifications() {
  if (process.env.EXPO_OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'SparFlow Erinnerungen',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 150, 250],
      sound: 'default',
    });
  }
}

export async function notificationPermissionGranted() {
  const status = await Notifications.getPermissionsAsync();
  return status.granted;
}

export async function requestNotificationPermission() {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;

  const requested = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
  return requested.granted;
}

function reminderData(kind: ReminderKind, sourceId: string, date: Date, url: string) {
  return {
    sparFlowReminder: true,
    kind,
    sourceId,
    scheduledFor: date.toISOString(),
    url,
  };
}

export async function scheduleLocalReminder(input: {
  kind: ReminderKind;
  sourceId: string;
  title: string;
  body: string;
  date: Date;
  url: string;
}) {
  if (input.date.getTime() <= Date.now() + 3_000) {
    throw new Error('Die Erinnerung muss in der Zukunft liegen.');
  }

  await configureLocalNotifications();
  const granted = await requestNotificationPermission();
  if (!granted) {
    throw new Error('Benachrichtigungen sind deaktiviert. Aktiviere sie in den iPhone-Einstellungen für SparFlow.');
  }

  await cancelRemindersForSource(input.kind, input.sourceId);

  const trigger: Notifications.DateTriggerInput = {
    type: Notifications.SchedulableTriggerInputTypes.DATE,
    date: input.date,
    ...(process.env.EXPO_OS === 'android' ? { channelId: CHANNEL_ID } : {}),
  };

  return Notifications.scheduleNotificationAsync({
    content: {
      title: input.title,
      body: input.body,
      sound: 'default',
      data: reminderData(input.kind, input.sourceId, input.date, input.url),
    },
    trigger,
  });
}

export async function cancelScheduledReminder(notificationId?: string | null) {
  if (!notificationId) return;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // The operating system may already have delivered or removed the reminder.
  }
}

export async function listScheduledSparFlowReminders(): Promise<ScheduledSparFlowReminder[]> {
  const requests = await Notifications.getAllScheduledNotificationsAsync();
  return requests.flatMap((request) => {
    const data = request.content.data as Record<string, unknown> | undefined;
    const kind = data?.kind;
    const sourceId = data?.sourceId;
    const scheduledFor = data?.scheduledFor;
    if (data?.sparFlowReminder !== true) return [];
    if (kind !== 'todo' && kind !== 'goal' && kind !== 'challenge') return [];
    if (typeof sourceId !== 'string' || typeof scheduledFor !== 'string') return [];
    return [{
      notificationId: request.identifier,
      kind,
      sourceId,
      scheduledFor,
      title: request.content.title ?? 'SparFlow Erinnerung',
    }];
  });
}

export async function cancelRemindersForSource(kind: ReminderKind, sourceId: string) {
  const reminders = await listScheduledSparFlowReminders();
  const matching = reminders.filter((item) => item.kind === kind && item.sourceId === sourceId);
  await Promise.all(matching.map((item) => cancelScheduledReminder(item.notificationId)));
}

export function subscribeToNotificationNavigation(onNavigate: (url: string) => void) {
  const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, unknown> | undefined;
    if (typeof data?.url === 'string') onNavigate(data.url);
  });
  return () => subscription.remove();
}

export async function getLastNotificationUrl() {
  const response = await Notifications.getLastNotificationResponseAsync();
  const data = response?.notification.request.content.data as Record<string, unknown> | undefined;
  return typeof data?.url === 'string' ? data.url : null;
}
