import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createDemoData, getUsers, findUserByEmail, addUser, createTrip, listTrips, updateTripStatus, addPayment, getDashboard, addPromo, getPromos, listDriverTrips } from './dataStore.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(publicDir));

const demo = createDemoData();

const auth = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.replace('Bearer ', '');

  if (!token || token === 'demo-invalid') {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const sessionUser = demo.users.find((user) => user.sessionToken === token);
  if (!sessionUser) {
    return res.status(401).json({ error: 'Invalid session' });
  }

  req.user = sessionUser;
  next();
};

app.get('/api/health', (req, res) => {
  res.json({ ok: true, app: 'FLASH', timestamp: new Date().toISOString() });
});

app.get('/api/config', (req, res) => {
  res.json({
    appName: 'FLASH',
    colors: {
      primary: '#FFD400',
      background: '#080808',
      graphite: '#171717',
      text: '#FFFFFF'
    },
    paymentMethods: ['Cartão', 'Pix', 'Dinheiro', 'Saldo'],
    categories: ['FLASH Econômico', 'FLASH Conforto', 'FLASH Premium', 'FLASH Moto']
  });
});

app.post('/api/auth/signup', (req, res) => {
  const { name, email, phone, password, role, vehicle, documents } = req.body;

  if (!name || !email || !phone || !password || !role) {
    return res.status(400).json({ error: 'Dados obrigatórios faltando' });
  }

  if (findUserByEmail(email)) {
    return res.status(409).json({ error: 'E-mail já cadastrado' });
  }

  const user = addUser({
    name,
    email,
    phone,
    password,
    role,
    status: role === 'driver' ? 'pending_verification' : 'active',
    vehicle: vehicle || null,
    documents: documents || [],
    createdAt: new Date().toISOString()
  });

  const token = `demo-token-${user.id}`;
  user.sessionToken = token;

  res.status(201).json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      status: user.status
    }
  });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;

  const user = findUserByEmail(email);
  if (!user || user.password !== password) {
    return res.status(401).json({ error: 'Credenciais inválidas' });
  }

  const token = `demo-token-${user.id}`;
  user.sessionToken = token;

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      status: user.status
    }
  });
});

app.get('/api/profile', auth, (req, res) => {
  const { password, sessionToken, ...safeUser } = req.user;
  res.json({ user: safeUser });
});

app.get('/api/users', auth, (req, res) => {
  res.json({ users: getUsers().map(({ password, sessionToken, ...user }) => user) });
});

app.get('/api/promos', auth, (req, res) => {
  res.json({ promos: getPromos() });
});

app.get('/api/trips', auth, (req, res) => {
  const trips = listTrips(req.user.id, req.user.role);
  res.json({ trips });
});

app.post('/api/trips/request', auth, (req, res) => {
  const { origin, destination, category, paymentMethod } = req.body;

  if (!origin || !destination || !category) {
    return res.status(400).json({ error: 'Origem, destino e categoria são obrigatórios' });
  }

  const trip = createTrip({
    passengerId: req.user.id,
    status: 'searching_driver',
    origin,
    destination,
    category,
    paymentMethod: paymentMethod || 'Cartão',
    estimate: {
      distanceKm: 8.4,
      durationMin: 18,
      fare: 31.9
    }
  });

  res.status(201).json({ trip });
});

app.post('/api/trips/:id/accept', auth, (req, res) => {
  const trip = updateTripStatus(req.params.id, 'accepted', req.user.id);
  if (!trip) {
    return res.status(404).json({ error: 'Corrida não encontrada' });
  }

  res.json({ trip });
});

app.post('/api/trips/:id/complete', auth, (req, res) => {
  const trip = updateTripStatus(req.params.id, 'completed', req.user.id);
  if (!trip) {
    return res.status(404).json({ error: 'Corrida não encontrada' });
  }

  const payment = addPayment({
    tripId: trip.id,
    amount: trip.estimate.fare,
    method: trip.paymentMethod,
    status: 'paid'
  });

  res.json({ trip, payment });
});

app.post('/api/payments/create-intent', auth, (req, res) => {
  const { amount, method } = req.body;

  const payment = addPayment({
    tripId: `demo-trip-${Date.now()}`,
    amount: amount || 31.9,
    method: method || 'Cartão',
    status: 'pending'
  });

  res.status(201).json({ payment });
});

app.get('/api/dashboard', auth, (req, res) => {
  res.json({ dashboard: getDashboard(req.user.role) });
});

app.get('/api/admin/overview', (req, res) => {
  res.json({ overview: getDashboard('admin') });
});

app.post('/api/promos/apply', auth, (req, res) => {
  const { code } = req.body;
  const promo = addPromo(code);
  res.json({ promo });
});

app.get('/api/driver/trips', auth, (req, res) => {
  if (req.user.role !== 'driver') {
    return res.status(403).json({ error: 'Acesso permitido apenas para motoristas' });
  }

  res.json({ trips: listDriverTrips(req.user.id) });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`FLASH backend running on http://localhost:${PORT}`);
});
