/* eslint-disable */

'use strict';

// Reserved Worker (1 Pending Reservation in backlog)
const fakeWorkerPayload = {
  sid: 'WKxxx',
  friendly_name: 'Alice',
  account_sid: 'ACxxx',
  activity_sid: 'WAxxx',
  activity_name: 'Reserved',
  workspace_sid: 'WSxxx',
  attributes: '{"languages":["en"]}',
  available: false,
  date_created: '2016-09-28T22:38:27Z',
  date_updated: '2017-01-06T18:47:02Z',
  date_status_changed: '2017-01-06T18:47:02Z',
  url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx',
  links:
  {
    channels: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx/Channels',
    activity: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Activities/WAzzz',
    workspace: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx'
  }
};

const fakeActivityNameUpdatePayload = {
  sid: 'WAxxz',
  account_sid: 'ACxxx',
  workspace_sid: 'WSxxx',
  friendly_name: 'OnBreak',
  available: false,
  date_created: '2016-09-28T22:31:08Z',
  date_updated: '2016-10-28T22:31:08Z',
  url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Activities/WAxxz',
  links: {
    workspace: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx'
  }
}

const fakeWorkerActivityUpdatePayload = {
  sid: 'WKxxx',
  friendly_name: 'Alice',
  account_sid: 'ACxxx',
  activity_sid: 'WAyyy',
  activity_name: 'Idle',
  workspace_sid: 'WSxxx',
  attributes: '{"languages":["en"]}',
  available: true,
  date_created: '2016-09-28T22:38:27Z',
  date_updated: '2017-01-06T19:24:07Z',
  date_status_changed: '2017-01-06T23:26:38Z',
  url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx',
  links:
  {
    channels: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx/Channels',
    activity: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Activities/WAyyy',
    workspace: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx'
  }
 };

const fakeWorkerAttributesUpdatePayload = {
  sid: 'WKxxx',
  friendly_name: 'Alice',
  account_sid: 'ACxxx',
  activity_sid: 'WAxxx',
  activity_name: 'Idle',
  workspace_sid: 'WSxxx',
  attributes: '{"languages":["en"]}',
  available: true,
  date_created: '2016-09-28T22:38:27Z',
  date_updated: '2017-01-05T19:45:22Z',
  date_status_changed: '2017-01-05T18:06:46Z',
  url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx',
  links: {
    channels: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx/Channels',
    activity: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Activities/WAxxx',
    workspace: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx'
  }
};

const fakeWorkerActivitiesPayload = {
  activities:
  [
    {
      sid: 'WAxxx',
      account_sid: 'ACxxx',
      workspace_sid: 'WSxxx',
      friendly_name: 'Offline',
      available: false,
      date_created: '2016-09-28T22:31:08Z',
      date_updated: '2016-09-28T22:31:08Z',
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Activities/WAxxx',
      links: {
        workspace: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx'
      }
    },
    {
      sid: 'WAyyy',
      account_sid: 'ACxxx',
      workspace_sid: 'WSxxx',
      friendly_name: 'Idle',
      available: true,
      date_created: '2016-09-28T22:31:08Z',
      date_updated: '2016-09-28T22:31:08Z',
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Activities/WAyyy',
      links: {
        workspace: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx'
      }
    },
    {
      sid: 'WAzzz',
      account_sid: 'ACxxx',
      workspace_sid: 'WSxxx',
      friendly_name: 'Reserved',
      available: false,
      date_created: '2016-09-28T22:31:08Z',
      date_updated: '2016-09-28T22:31:08Z',
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Activities/WAzzz',
      links: {
        workspace: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx'
      }
    },
    {
      sid: 'WAxxy',
      account_sid: 'ACxxx',
      workspace_sid: 'WSxxx',
      friendly_name: 'Busy',
      available: false,
      date_created: '2016-09-28T22:31:08Z',
      date_updated: '2016-09-28T22:31:08Z',
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Activities/WAxxy',
      links: {
        workspace: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx'
      }
    },
    {
      sid: 'WAxxz',
      account_sid: 'ACxxx',
      workspace_sid: 'WSxxx',
      friendly_name: 'Away',
      available: false,
      date_created: '2016-09-28T22:31:08Z',
      date_updated: '2016-09-28T22:31:08Z',
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Activities/WAxxz',
      links: {
        workspace: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx'
      }
    }
  ]
};


const fakeWorkerChannelsPayload = {
  channels:
  [
    {
      sid: 'WCxxx',
      account_sid: 'ACxxx',
      workspace_sid: 'WSxxx',
      worker_sid: 'WKxxx',
      task_channel_sid: 'TCxxx',
      task_channel_unique_name: 'ipm',
      configured_capacity: 1,
      available: true,
      assigned_tasks: 0,
      available_capacity_percentage: 100,
      date_created: '2016-09-28T22:38:27Z',
      date_updated: '2016-09-28T22:38:27Z',
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx/Channels/WCxxx'
    },
    {
      sid: 'WCyyy',
      account_sid: 'ACxxx',
      workspace_sid: 'WSxxx',
      worker_sid: 'WKxxx',
      task_channel_sid: 'TCyyy',
      task_channel_unique_name: 'default',
      configured_capacity: 1,
      available: true,
      assigned_tasks: 0,
      available_capacity_percentage: 100,
      date_created: '2016-09-28T22:38:27Z',
      date_updated: '2016-09-28T22:38:27Z',
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx/Channels/WCyyy'
    },
    {
      sid: 'WCzzz',
      account_sid: 'ACxxx',
      workspace_sid: 'WSxxx',
      worker_sid: 'WKxxx',
      task_channel_sid: 'TCzzz',
      task_channel_unique_name: 'video',
      configured_capacity: 1,
      available: true,
      assigned_tasks: 0,
      available_capacity_percentage: 100,
      date_created: '2016-09-28T22:38:27Z',
      date_updated: '2016-09-28T22:38:27Z',
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx/Channels/WCzzz'
    },
    {
      sid: 'WCxxy',
      account_sid: 'ACxxx',
      workspace_sid: 'WSxxx',
      worker_sid: 'WKxxx',
      task_channel_sid: 'TCxxy',
      task_channel_unique_name: 'voice',
      configured_capacity: 1,
      available: true,
      assigned_tasks: 0,
      available_capacity_percentage: 100,
      date_created: '2016-09-28T22:38:27Z',
      date_updated: '2016-09-28T22:38:27Z',
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx/Channels/WCxxy'
    },
    {
      sid: 'WCxxz',
      account_sid: 'ACxxx',
      workspace_sid: 'WSxxx',
      worker_sid: 'WKxxx',
      task_channel_sid: 'TCxxz',
      task_channel_unique_name: 'sms',
      configured_capacity: 1,
      available: true,
      assigned_tasks: 0,
      available_capacity_percentage: 100,
      date_created: '2016-09-28T22:38:27Z',
      date_updated: '2016-09-28T22:38:27Z',
      url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx/Channels/WCxxz'
    }
  ]
};

const fakeChannelAvailabilityUpdate = {
  sid: 'WCxxx',
  account_sid: 'ACxxx',
  workspace_sid: 'WSxxx',
  worker_sid: 'WKxxx',
  task_channel_sid: 'TCxxx',
  task_channel_unique_name: 'ipm',
  configured_capacity: 1,
  available: false,
  assigned_tasks: 0,
  available_capacity_percentage: 100,
  date_created: '2016-09-28T22:38:27Z',
  date_updated: '2016-09-28T22:38:27Z',
  url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx/Channels/WCxxx'
}

const fakeChannelCapacityUpdate = {
  sid: 'WCxxx',
  account_sid: 'ACxxx',
  workspace_sid: 'WSxxx',
  worker_sid: 'WKxxx',
  task_channel_sid: 'TCxxx',
  task_channel_unique_name: 'ipm',
  configured_capacity: 5,
  available: false,
  assigned_tasks: 0,
  available_capacity_percentage: 100,
  date_created: '2016-09-28T22:38:27Z',
  date_updated: '2016-09-28T22:38:27Z',
  url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx/Channels/WCxxx'
}


const fakeReservationPayload = {
  account_sid: 'ACxxx',
  workspace_sid: 'WSxxx',
  sid: 'WTxxx',
  date_created: 1484245921,
  date_updated: 1484245921,
  attributes: '{}',
  assignment_status: 'reserved',
  workflow_sid: 'WWxxx',
  workflow_name: 'Incoming Requests',
  queue_sid: 'WQxxx',
  queue_name: 'EN',
  priority: 0,
  reason: null,
  timeout: 86400,
  task_channel_sid: 'TCxxx',
  task_channel_unique_name: null,
  counter: 0,
  age: 0,
  addons: '{}',
  reservation_sid: 'WRxxx'
}

const fakeTaskPayload = {
  workspace_sid: 'WSxxx',
  assignment_status: 'assigned',
  date_updated: '2017-01-12T19:18:19Z',
  age: 1,
  sid: 'WTxxx',
  account_sid: 'ACxxx',
  priority: 0,
  url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx',
  reason: null,
  task_queue_sid: 'WQxxx',
  workflow_friendly_name: 'Incoming Requests',
  timeout: 86400,
  attributes: '{}',
  date_created: '2017-01-12T19:18:18Z',
  task_channel_sid: 'TCxxx',
  addons: '{}',
  task_channel_unique_name: null,
  workflow_sid: 'WWxxx',
  task_queue_friendly_name: 'EN',
  links:
  { reservations: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx/Reservations',
     task_queue: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/TaskQueues/WQxxx',
     workspace: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx',
     workflow: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workflows/WWxxx'
  }
};

const fakeCompleteTaskPayload = {
  workspace_sid: 'WSxxx',
  assignment_status: 'completed',
  date_updated: '2017-01-12T21:23:44Z',
  age: 2,
  sid: 'WTxxx',
  account_sid: 'ACxxx',
  priority: 0,
  url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx',
  reason: 'Work is finished.',
  task_queue_sid: 'WQxxx',
  workflow_friendly_name: 'Incoming Requests',
  timeout: 86400,
  attributes: '{}',
  date_created: '2017-01-12T21:23:42Z',
  task_channel_sid: 'TCxxx',
  addons: '{}',
  task_channel_unique_name: 'default',
  workflow_sid: 'WWxxx',
  task_queue_friendly_name: 'EN',
  links:
  {
    reservations: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx/Reservations',
    task_queue: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/TaskQueues/WQxxx',
    workspace: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx',
    workflow: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workflows/WWxxx'
  }
};

const fakeAcceptedReservationPayload = {
  sid: 'WRxxx',
  account_sid: 'ACxxx',
  workspace_sid: 'WSxxx',
  task_sid: 'WTxxx',
  worker_sid: 'WKxxx',
  worker_name: 'Alice',
  reservation_status: 'accepted',
  date_created: '2017-01-13T18:34:40Z',
  date_updated: '2017-01-13T18:34:40Z',
  task_channel_unique_name: null,
  task_channel_sid: 'TCxxx',
  url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx/Reservations/WRxxx',
  links:
  {
    task: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx',
    worker: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx',
    workspace: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx'
  }
};

const fakeRejectedReservationPayload = {
  sid: 'WRxxx',
  account_sid: 'ACxxx',
  workspace_sid: 'WSxxx',
  task_sid: 'WTxxx',
  worker_sid: 'WKxxx',
  worker_name: 'Alice',
  reservation_status: 'rejected',
  date_created: '2017-01-13T18:34:40Z',
  date_updated: '2017-01-13T18:34:40Z',
  task_channel_unique_name: null,
  task_channel_sid: 'TCxxx',
  url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx/Reservations/WRxxx',
  links:
  {
    task: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx',
    worker: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx',
    workspace: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx'
  }
};

const fakeCallReservationPayload = {
  sid: 'WRxxx',
  account_sid: 'ACxxx',
  workspace_sid: 'WSxxx',
  task_sid: 'WTxxx',
  worker_sid: 'WKxxx',
  worker_name: 'Alice',
  reservation_status: 'pending',
  date_created: '2017-01-19T21:35:28Z',
  date_updated: '2017-01-19T21:35:28Z',
  task_channel_unique_name: null,
  task_channel_sid: 'TCxxx',
  url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx/Reservations/WRxxx',
  links:
   { task: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx',
     worker: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx',
     workspace: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx'
   }
 };

 const fakeDequeueReservationPayload = {
  sid: 'WRxxx',
  account_sid: 'ACxxx',
  workspace_sid: 'WSxxx',
  task_sid: 'WTxxx',
  worker_sid: 'WKxxx',
  worker_name: 'Alice',
  reservation_status: 'pending',
  date_created: '2017-01-19T23:12:20Z',
  date_updated: '2017-01-19T23:12:20Z',
  task_channel_unique_name: null,
  task_channel_sid: 'TCxxx',
  url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx/Reservations/WRxxx',
  links: {
    task: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx',
    worker: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx',
    workspace: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx'
  }
};

const fakeRedirectReservationPayload = {
  sid: 'WRxxx',
  account_sid: 'ACxxx',
  workspace_sid: 'WSxxx',
  task_sid: 'WTxxx',
  worker_sid: 'WKxxx',
  worker_name: 'Alice',
  reservation_status: 'pending',
  date_created: '2017-01-19T23:12:20Z',
  date_updated: '2017-01-19T23:12:20Z',
  task_channel_unique_name: null,
  task_channel_sid: 'TCxxx',
  url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx/Reservations/WRxxx',
  links: {
    task: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx',
    worker: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx',
    workspace: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx'
  }
};

const fakeTimedOutReservationPayload = {
  sid: 'WRxxx',
  account_sid: 'ACxxx',
  workspace_sid: 'WSxxx',
  task_sid: 'WTxxx',
  worker_sid: 'WKxxx',
  worker_name: 'Alice',
  reservation_status: 'timeout',
  date_created: '2017-01-19T23:12:20Z',
  date_updated: '2017-01-19T23:12:20Z',
  task_channel_unique_name: null,
  task_channel_sid: 'TCxxx',
  url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx/Reservations/WRxxx',
  links: {
    task: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx',
    worker: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx',
    workspace: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx'
  }
};

const fakeCanceledReservationPayload = {
  sid: 'WRxxx',
  account_sid: 'ACxxx',
  workspace_sid: 'WSxxx',
  task_sid: 'WTxxx',
  worker_sid: 'WKxxx',
  worker_name: 'Alice',
  reservation_status: 'canceled',
  date_created: '2017-01-19T23:12:20Z',
  date_updated: '2017-01-19T23:12:20Z',
  task_channel_unique_name: null,
  task_channel_sid: 'TCxxx',
  url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx/Reservations/WRxxx',
  links: {
    task: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx',
    worker: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx',
    workspace: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx'
  }
};

const fakeRescindedReservationPayload = {
  sid: 'WRxxx',
  account_sid: 'ACxxx',
  workspace_sid: 'WSxxx',
  task_sid: 'WTxxx',
  worker_sid: 'WKxxx',
  worker_name: 'Alice',
  reservation_status: 'rescinded',
  date_created: '2017-01-19T23:12:20Z',
  date_updated: '2017-01-19T23:12:20Z',
  task_channel_unique_name: null,
  task_channel_sid: 'TCxxx',
  url: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx/Reservations/WRxxx',
  links: {
    task: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Tasks/WTxxx',
    worker: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx/Workers/WKxxx',
    workspace: 'https://taskrouter.twilio.com/v1/Workspaces/WSxxx'
  }
};

const fakePayloads = {
  worker: fakeWorkerPayload,
  workerAttributesUpdate: fakeWorkerAttributesUpdatePayload,
  workerActivityUpdate: fakeWorkerActivityUpdatePayload,
  
  activities: fakeWorkerActivitiesPayload,
  activityNameUpdate: fakeActivityNameUpdatePayload,
  
  channels: fakeWorkerChannelsPayload,
  channelAvailabilityUpdate: fakeChannelAvailabilityUpdate,
  channelCapacityUpdate: fakeChannelCapacityUpdate,
  
  reservation: fakeReservationPayload,
  acceptedReservation: fakeAcceptedReservationPayload,
  rejectedReservation: fakeRejectedReservationPayload,
  callReservation: fakeCallReservationPayload,
  dequeuedReservation: fakeDequeueReservationPayload,
  redirectedReservation: fakeRedirectReservationPayload,
  timedOutReservation: fakeTimedOutReservationPayload,
  canceledReservation: fakeCanceledReservationPayload,
  rescindedReservation: fakeRescindedReservationPayload,

  task: fakeTaskPayload,
  completedTask: fakeCompleteTaskPayload
};

module.exports.fakePayloads = fakePayloads;
