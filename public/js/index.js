import '@babel/polyfill';

import { login, logout } from './login';
import { displayMap } from './mapBox';
import { updateUserSettings } from './updateSettings';
import { bookTour } from './stripe';

const mapBox = document.getElementById('map');
const form = document.querySelector('.form--login');
const dataForm = document.querySelector('.form');
const logoutBtn = document.querySelector('.nav__el--logout');
const passwordForm = document.querySelector('.form-user-password');
const bookBtn = document.querySelector('.book');

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
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);

    await updateUserSettings(form, 'data');
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

if (bookBtn) {
  bookBtn.addEventListener('click', (e) => {
    e.target.textContent = 'processing';
    const { tourId } = e.target.dataset;
    bookTour(tourId);
  });
}
