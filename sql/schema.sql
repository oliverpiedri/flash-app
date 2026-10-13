const state = {
  authMode: 'login',
  token: localStorage.getItem('flash-token') || '',
  user: JSON.parse(localStorage.getItem('flash-user') || 'null')
};

const authScreen = document.getElementById('auth-screen');
const passengerScreen = document.getElementById('passenger-screen');
const driverScreen = document.getElementById('driver-screen');
const adminScreen = document.getElementById('admin-screen');
const authForm = document.getElementById('auth-form');
const authName = document.getElementById('auth-name');
const authEmail = document.getElementById('auth-email');
const authPhone = document.getElementById('auth-phone');
const authPassword = document.getElementById('auth-password');
const authRole = document.getElementById('auth-role');

const tabs = document.querySelectorAll('.tab');
const navButtons = document.querySelectorAll('.nav-btn');
const screens = {
  passenger: passengerScreen,
  driver: driverScreen,
  admin: adminScreen
};

const setAuthMode = (mode) => {
  state.authMode = mode;
  const isSignup = mode === 'signup';
  authName.classList.toggle('hidden', !isSignup);
  authPhone.classList.toggle('hidden', !isSignup);
  authRole.classList.toggle('hidden', !isSignup);

  tabs.forEach((tab) => tab.classList.toggle('active', tab.dataset.auth === mode));
  const submitText = isSignup ? 'Criar conta' : 'Entrar';
  authForm.querySelector('button[type="submit"]').textContent = submitText;
};

const showScreen = (screenName) => {
  Object.entries(screens).forEach(([name, el]) => {
    el.classList.toggle('visible', name === screenName);
  });

  navButtons.forEach((btn) => btn.classList.toggle('active', btn.dataset.screen === screenName));

  if (screenName === 'passenger') {
    loadTrips();
  }
  if (screenName === 'driver') {
    loadDriverTrips();
  }
  if (screenName === 'admin') {
    loadAdminOverview();
  }
};

const showAuth = () => {
  authScreen.classList.add('visible');
  passengerScreen.classList.remove('visible');
  driverScreen.classList.remove('visible');
  adminScreen.classList.remove('visible');
};

const saveSession = (token, user) => {
  state.token = token;
  state.user = user;
  localStorage.setItem('flash-token', token);
  localStorage.setItem('flash-user', JSON.stringify(user));
};

const clearSession = () => {
  state.token = '';
  state.user = null;
  localStorage.removeItem('flash-token');
  localStorage.removeItem('flash-user');
  showAuth();
};

const afterLogin = () => {
  authScreen.classList.remove('visible');
  if (!state.user) return;

  const target = state.user.role === 'driver' ? 'driver' : state.user.role === 'admin' ? 'admin' : 'passenger';
  showScreen(target);
};

const api = async (url, options = {}) => {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };

  if (state.token) {
    headers.Authorization = `Bearer ${state.token}`;
  }

  const response = await fetch(url, { ...options, headers });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || 'Request failed');
  }

  return payload;
};

const loadTrips = async () => {
  try {
    const response = await api('/api/trips');
    const list = document.getElementById('trip-list');
    list.innerHTML = '';

    response.trips.forEach((trip) => {
      const item = document.createElement('li');
      item.innerHTML = `
        <strong>${trip.category}</strong>
        <span>${trip.origin} → ${trip.destination}</span><br />
        <span>Status: ${trip.status} | ${trip.paymentMethod}</span>
      `;
      list.appendChild(item);
    });
  } catch (error) {
    console.error(error);
  }
};

const loadDriverTrips = async () => {
  try {
    const response = await api('/api/driver/trips');
    const list = document.getElementById('driver-trips');
    list.innerHTML = '';

    response.trips.forEach((trip) => {
      const item = document.createElement('li');
      item.innerHTML = `
        <strong>${trip.category}</strong>
        <span>${trip.origin} → ${trip.destination}</span><br />
        <span>Status: ${trip.status}</span>
      `;
      const acceptBtn = document.createElement('button');
      acceptBtn.className = 'primary-btn small';
      acceptBtn.textContent = 'Aceitar';
      acceptBtn.onclick = async () => {
        await api(`/api/trips/${trip.id}/accept`, { method: 'POST' });
        loadDriverTrips();
      };
      item.appendChild(acceptBtn);
      list.appendChild(item);
    });
  } catch (error) {
    console.error(error);
  }
};

const loadAdminOverview = async () => {
  try {
    const response = await api('/api/admin/overview');
    const overview = response.overview.overview;
    document.getElementById('admin-trips').textContent = overview.totalTrips;
    document.getElementById('admin-revenue').textContent = `R$ ${overview.revenue.toFixed(2)}`;
    document.getElementById('admin-drivers').textContent = overview.activeDrivers;

    const list = document.getElementById('admin-list');
    list.innerHTML = '';

    overview.alerts.forEach((alert) => {
      const item = document.createElement('li');
      item.innerHTML = `<strong>${alert}</strong><span>Operação ativa</span>`;
      list.appendChild(item);
    });
  } catch (error) {
    console.error(error);
  }
};

const requestTrip = async () => {
  try {
    const origin = document.getElementById('origin-input').value;
    const destination = document.getElementById('destination-input').value;
    const category = document.getElementById('category-select').value;
    const paymentMethod = document.getElementById('payment-method').value;

    const response = await api('/api/trips/request', {
      method: 'POST',
      body: JSON.stringify({ origin, destination, category, paymentMethod })
    });

    alert(`Corrida criada com sucesso! ID: ${response.trip.id}`);
    loadTrips();
  } catch (error) {
    alert(error.message);
  }
};

const handleAuthSubmit = async (event) => {
  event.preventDefault();

  try {
    const payload = {
      email: authEmail.value,
      password: authPassword.value
    };

    if (state.authMode === 'signup') {
      payload.name = authName.value;
      payload.phone = authPhone.value;
      payload.role = authRole.value;
      const result = await api('/api/auth/signup', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      saveSession(result.token, result.user);
      alert('Conta criada com sucesso!');
    } else {
      const result = await api('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(payload)
      });
      saveSession(result.token, result.user);
      alert('Login realizado com sucesso!');
    }

    afterLogin();
  } catch (error) {
    alert(error.message);
  }
};

if (state.token && state.user) {
  afterLogin();
} else {
  showAuth();
}

navButtons.forEach((button) => {
  button.addEventListener('click', () => {
    const screenName = button.dataset.screen;
    if (screenName === 'passenger' && !state.user) return showAuth();
    if (screenName === 'driver' && (!state.user || state.user.role !== 'driver')) return alert('Acesso restrito para motoristas');
    if (screenName === 'admin' && (!state.user || state.user.role !== 'admin')) return alert('Acesso restrito para administradores');
    showScreen(screenName);
  });
});

tabs.forEach((tab) => {
  tab.addEventListener('click', () => setAuthMode(tab.dataset.auth));
});

authForm.addEventListener('submit', handleAuthSubmit);
document.getElementById('request-trip-btn').addEventListener('click', requestTrip);
document.getElementById('logout-btn').addEventListener('click', clearSession);
document.getElementById('driver-status-btn').addEventListener('click', () => {
  const btn = document.getElementById('driver-status-btn');
  const active = btn.dataset.active === 'true';
  btn.dataset.active = String(!active);
  btn.textContent = active ? 'Indisponível' : 'Disponível';
  btn.style.background = active ? 'rgba(255,255,255,0.1)' : '#FFD400';
  btn.style.color = active ? '#FFFFFF' : '#080808';
});

setAuthMode('login');
