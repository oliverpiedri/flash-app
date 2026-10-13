const demoUsers = [];
const demoTrips = [];
const demoPayments = [];
const demoPromos = [
  { code: 'FLASH10', discount: 10, type: 'percent', description: 'Desconto de 10% em primeira corrida' },
  { code: 'FLASH20', discount: 20, type: 'percent', description: 'Desconto promocional para viagens de domingo' },
  { code: 'FLASH30', discount: 30, type: 'percent', description: 'Promoção de lançamento' }
];

export const createDemoData = () => ({
  users: [
    {
      id: 'u-passenger-1',
      name: 'Maria Silva',
      email: 'passageiro@flash.com',
      phone: '+5511999999999',
      password: '123456',
      role: 'passenger',
      status: 'active',
      vehicle: null,
      documents: [],
      createdAt: new Date().toISOString(),
      sessionToken: 'demo-passenger-token'
    },
    {
      id: 'u-driver-1',
      name: 'João Motorista',
      email: 'motorista@flash.com',
      phone: '+5511888888888',
      password: '123456',
      role: 'driver',
      status: 'active',
      vehicle: {
        model: 'Volkswagen Gol',
        plate: 'ABC-1234',
        color: 'Prata',
        year: 2022,
        category: 'FLASH Conforto'
      },
      documents: ['CNH', 'Documento', 'CRLV'],
      createdAt: new Date().toISOString(),
      sessionToken: 'demo-driver-token'
    },
    {
      id: 'u-admin-1',
      name: 'Admin FLASH',
      email: 'admin@flash.com',
      phone: '+5511777777777',
      password: '123456',
      role: 'admin',
      status: 'active',
      vehicle: null,
      documents: [],
      createdAt: new Date().toISOString(),
      sessionToken: 'demo-admin-token'
    }
  ],
  trips: [
    {
      id: 'trip-1',
      passengerId: 'u-passenger-1',
      driverId: 'u-driver-1',
      status: 'completed',
      origin: 'Avenida Paulista, 1000',
      destination: 'Parque Ibirapuera',
      category: 'FLASH Conforto',
      paymentMethod: 'Cartão',
      estimate: { distanceKm: 8.4, durationMin: 18, fare: 31.9 },
      startedAt: '2026-10-01T18:22:00.000Z',
      endedAt: '2026-10-01T18:40:00.000Z'
    }
  ],
  payments: [],
  promos: demoPromos
});

export const store = createDemoData();

export const getUsers = () => store.users;

export const findUserByEmail = (email) => store.users.find((user) => user.email.toLowerCase() === String(email).toLowerCase());

export const addUser = (user) => {
  const newUser = {
    id: `u-${Date.now()}`,
    ...user
  };
  store.users.push(newUser);
  return newUser;
};

export const listTrips = (userId, role) => {
  if (role === 'driver') {
    return store.trips.filter((trip) => trip.driverId === userId || trip.status === 'searching_driver');
  }

  if (role === 'admin') {
    return store.trips;
  }

  return store.trips.filter((trip) => trip.passengerId === userId);
};

export const createTrip = ({ passengerId, status, origin, destination, category, paymentMethod, estimate }) => {
  const newTrip = {
    id: `trip-${Date.now()}`,
    passengerId,
    driverId: 'u-driver-1',
    status,
    origin,
    destination,
    category,
    paymentMethod,
    estimate,
    createdAt: new Date().toISOString()
  };
  store.trips.unshift(newTrip);
  return newTrip;
};

export const updateTripStatus = (tripId, status, userId) => {
  const trip = store.trips.find((item) => item.id === tripId);
  if (!trip) return null;

  trip.status = status;
  if (status === 'accepted') trip.driverId = userId;
  if (status === 'completed') trip.endedAt = new Date().toISOString();

  return trip;
};

export const addPayment = ({ tripId, amount, method, status }) => {
  const payment = {
    id: `pay-${Date.now()}`,
    tripId,
    amount,
    method,
    status,
    createdAt: new Date().toISOString()
  };
  store.payments.push(payment);
  return payment;
};

export const getPromos = () => store.promos;

export const addPromo = (code) => {
  const promo = store.promos.find((item) => item.code.toLowerCase() === String(code).toLowerCase());
  if (!promo) {
    return { valid: false, message: 'Cupom inválido' };
  }

  return { valid: true, ...promo };
};

export const getDashboard = (role) => ({
  overview: {
    totalTrips: store.trips.length,
    revenue: store.payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0),
    activeDrivers: store.users.filter((user) => user.role === 'driver').length,
    conversion: role === 'admin' ? '18.4%' : '12.1%'
  },
  recentTrips: store.trips.slice(0, 5),
  alerts: [
    '3 corridas aguardando aprovação',
    '2 pagamentos pendentes',
    '1 motorista em verificação'
  ]
});

export const listDriverTrips = (driverId) => store.trips.filter((trip) => trip.driverId === driverId || trip.status === 'searching_driver');
