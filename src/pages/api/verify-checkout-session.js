import Stripe from 'stripe';

export const prerender = false;

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

export async function POST({ request }) {
	try {
		let payload = null;
		try {
			payload = await request.json();
		} catch {
			return json({ error: 'Invalid JSON body. Expected { sessionId }' }, 400);
		}

		const sessionId = String(payload?.sessionId || '').trim();
		if (!sessionId) return json({ error: 'Missing sessionId' }, 400);

		const session = await stripe.checkout.sessions.retrieve(sessionId);

		// `paid` is the key signal for one-time payments via Checkout.
		const paid = session?.payment_status === 'paid';

		return json({ paid }, 200);
	} catch (err) {
		console.error('Stripe verify-checkout-session error:', err);
		return json({ error: 'Unable to verify checkout session' }, 500);
	}
}

function json(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}


