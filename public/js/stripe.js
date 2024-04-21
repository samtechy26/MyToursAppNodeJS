import axios from 'axios';
import { showAlert } from './alert';
const stripe = Stripe(
  'pk_test_51P7APPKdnAQg2VoyYOAjKK5i3VVzMcv7eWZ7dnwk6xQstLF8U4V5uUo8FEKNuhlUKKIPeudTmGEU615CmsirdsYn00B0TLFcWt',
);

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
