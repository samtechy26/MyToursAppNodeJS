import axios from 'axios';
import { showAlert } from './alert';

export const updateUserSettings = async (data, type) => {
  try {
    const url =
      type === 'data'
        ? 'http://127.0.0.1:8000/api/v1/users/updateme'
        : 'http://127.0.0.1:8000/api/v1/users/updatepassword';
    const res = await axios({
      method: 'PATCH',
      url: url,
      data: data,
    });

    if (res.data.status === 'success') {
      showAlert(
        'success',
        `Successfully updated ${type === 'data' ? 'data' : 'password'}`,
      );
    }
  } catch (err) {
    showAlert(err.response.data.message);
  }
};
