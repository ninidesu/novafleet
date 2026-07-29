// Mock data standing in for the real backend, matching the wireframe's demo
// content (driver-app/design/wireframe.html) so the two stay in sync.

export const DRIVER = {
  name: 'Brian Otieno',
  initials: 'BO',
  id: 'DRV-1042',
  branch: 'Kitengela Branch',
  phone: '+254 712 445 210',
  device: 'Pixel 7a',
};

export const NEXT_TRIP = {
  ref: 'TRP-58291',
  route: 'Kitengela Branch → Machakos Client Circuit',
  vehicle: 'Toyota Hilux · KDG 214P',
  vehiclePlate: 'KDG 214P',
  time: 'Today · 10:30',
  status: 'Ready',
  schedule: '10:30 → 12:10 · Today',
  purpose: 'Loan disbursement',
  tracking: 'IoT device',
  contactName: 'Grace Wambui',
  contactRole: 'Field Officer',
  contactPhone: '+254 733 210 447',
  instructions:
    'Carry the disbursement receipt book. Confirm client ID before releasing funds. Report road closures immediately.',
  evidence: 'Starting and ending odometer photo. Fuel receipt if refueling en route.',
};

export const ASSIGNMENTS = {
  Today: [
    { route: 'Machakos Client Circuit', time: 'Today · 10:30', vehicle: 'KDG 214P', status: 'Ready' },
    { route: 'Kajiado Loan Group Visit', time: 'Today · 14:15', vehicle: 'KDG 214P', status: 'Scheduled' },
  ],
  Upcoming: [{ route: 'Ongata Rongai Field Visit', time: 'Tomorrow · 09:00', vehicle: 'KDG 214P', status: 'Scheduled' }],
  Completed: [{ route: 'Athi River Collections', time: 'Yesterday · 09:00', vehicle: 'KBZ 118H', status: 'Completed' }],
  Cancelled: [{ route: 'Kitengela → Isinya Branch', time: '26 Jul · 08:00', vehicle: 'KDG 214P', status: 'Cancelled' }],
};

export const FUEL_RECORDS = [
  { date: 'Today, 11:52', vehicle: 'KDG 214P', liters: '32.5 L', total: 'KES 6,305', odo: '48,262 km', status: 'Pending' },
  { date: 'Yesterday', vehicle: 'KBZ 118H', liters: '28.0 L', total: 'KES 5,432', odo: '41,880 km', status: 'Approved' },
  { date: '24 Jul', vehicle: 'KDG 214P', liters: '30.2 L', total: 'KES 5,859', odo: '47,410 km', status: 'Rejected' },
  { date: '22 Jul', vehicle: 'KDG 214P', liters: '—', total: '—', odo: '—', status: 'Saved Offline' },
];

export const TRIP_HISTORY = [
  { route: 'Kitengela → Machakos Circuit', date: '29 Jul', vehicle: 'KDG 214P', distance: '24.6 km', status: 'Completed', ref: 'TRP-58291', tracking: 'IoT tracker' },
  { route: 'Machakos Depot → Athi River', date: '27 Jul', vehicle: 'KBZ 118H', distance: '31.0 km', status: 'Completed', ref: 'TRP-58210', tracking: 'Phone GPS' },
  { route: 'Kitengela → Ongata Rongai', date: '25 Jul', vehicle: 'KDG 214P', distance: '—', status: 'Cancelled', ref: 'TRP-58166', tracking: '—' },
];

export const NOTIFICATIONS = [
  { icon: 'assignments', title: 'New trip assigned', body: 'TRP-58291 · 10:30', time: '8 min ago', unread: true },
  { icon: 'alertTriangle', title: 'Tracker offline', body: 'Use phone GPS.', time: '1 hr ago', unread: true },
  { icon: 'route', title: 'Off route', body: '1.4 km from route.', time: '3 hr ago', unread: true },
  { icon: 'droplet', title: 'Fuel record rejected', body: 'Upload a clearer receipt.', time: 'Yesterday', unread: false },
  { icon: 'checkCircle', title: 'Trip synced', body: 'All records uploaded.', time: 'Yesterday', unread: false },
  { icon: 'calendar', title: 'Trip starting soon', body: 'Departs in 30 min.', time: '2 days ago', unread: false },
];

export const INCIDENT_TYPES = ['Accident', 'Breakdown', 'Flat tire', 'Road closed', 'Delay', 'Security', 'Medical', 'Other'];

export const TRACKING_REASONS = [
  'No IoT device installed',
  'IoT device offline',
  'IoT device damaged',
  'Temporary vehicle',
  'Administrator instruction',
  'Other reason',
];
