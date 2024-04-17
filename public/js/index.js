import '@babel/polyfill';
import { login, logout } from './login';
import { displayMap } from './mapBox';
import { updateUserSettings } from './updateSettings';

const mapBox = document.getElementById('map');
const form = document.querySelector('.form--login');
const dataForm = document.querySelector('.form');
const logoutBtn = document.querySelector('.nav__el--logout');
const passwordForm = document.querySelector('.form-user-password');

if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    await login(email, password);
  });
}

if (dataForm) {
  dataForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    await updateUserSettings({ name, email }, 'data');
  });
}

if (passwordForm) {
  passwordForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const passwordCurrent = document.getElementById('password-current').value;
    const password = document.getElementById('password').value;
    const passwordConfirm = document.getElementById('password-confirm').value;

    await updateUserSettings(
      { passwordCurrent, password, passwordConfirm },
      'password',
    );

    passwordCurrent = '';
    password = '';
    passwordConfirm = '';
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', logout);
}
