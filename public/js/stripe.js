import axios from 'axios';
import { showAlert } from './alert';
const stripe = stripe(process.env.STRIPE_PUBLIC_KEY);

export const bookTour = async (tourId) => {
  // Get the checkout session from the API
  try {
    const session = await axios(
      `http://127.0.0.1:8000/api/v1/bookings/checkout-session/${tourId}`,
    );

    // create checkout form  + charge credit card
    await stripe.redirectToCheckout({
      sessionId: session.data.session.id,
    });
  } catch (err) {
    console.log(err);
    showAlert('error', err);
  }
};
