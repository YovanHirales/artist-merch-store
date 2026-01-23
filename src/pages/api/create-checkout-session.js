import Stripe from 'stripe';

export const prerender = false;

const stripe = new Stripe(import.meta.env.STRIPE_SECRET_KEY);

// Security: Price IDs must be provided via STRIPE_ALLOWED_PRICE_IDS env var.
// Order doesn't matter (stored in a Set). Format: comma-separated, e.g.:
// STRIPE_ALLOWED_PRICE_IDS=price_1ABC...,price_1XYZ...,price_1DEF...
const priceIdsEnv = String(
	import.meta.env.STRIPE_ALLOWED_PRICE_IDS || ''
).trim();
if (!priceIdsEnv) {
	throw new Error(
		'STRIPE_ALLOWED_PRICE_IDS environment variable is required. Set it to a comma-separated list of Stripe price IDs.'
	);
}
const ALLOWED_PRICE_IDS = new Set(
	priceIdsEnv
		.split(',')
		.map((s) => s.trim())
		.filter(Boolean)
);

export async function POST({ request }) {
	try {
		let payload = null;
		try {
			payload = await request.json();
		} catch {
			return json(
				{
					error:
						'Invalid or missing JSON body. Expected { items: [{ priceId, quantity }] }',
				},
				400
			);
		}
		const items = Array.isArray(payload?.items) ? payload.items : [];

		if (!items.length) return json({ error: 'No items' }, 400);

		const line_items = [];
		for (const item of items) {
			const priceId = item?.priceId;
			if (!priceId || !ALLOWED_PRICE_IDS.has(priceId)) {
				return json({ error: 'Invalid item price' }, 400);
			}
			const qty =
				typeof item.quantity === 'number' && item.quantity > 0
					? item.quantity
					: 1;
			// Add metadata to each line item for easy viewing in Stripe dashboard
			line_items.push({
				price: priceId,
				quantity: qty,
				adjustable_quantity: { enabled: false },
			});
		}

		const origin = getRequestOrigin(request);
		if (!origin) {
			return json(
				{
					error:
						'Unable to determine site origin for success/cancel URLs. Set SITE_URL to something like https://yourdomain.com',
				},
				500
			);
		}

		const allowedCountries = String(
			import.meta.env.STRIPE_ALLOWED_COUNTRIES || 'US'
		)
			.split(',')
			.map((s) => s.trim())
			.filter(Boolean);

		const shippingRateId = String(
			import.meta.env.STRIPE_SHIPPING_RATE_ID || ''
		).trim();

		// Build readable metadata for easy viewing in Stripe dashboard
		const orderSummary = items
			.map((item, idx) => {
				const size = item.size || 'N/A';
				const qty = item.quantity || 1;
				const title = item.title || item.productId || 'Unknown';
				return `Item ${idx + 1}: ${title} - Size ${size} x${qty}`;
			})
			.join(' | ');

		// Build individual metadata fields for each item
		const metadata = {
			// Human-readable order summary
			order_summary: orderSummary,
			// Total number of items
			total_items: items.reduce((sum, item) => sum + (item.quantity || 1), 0).toString(),
			// Full cart details as JSON (for programmatic access)
			cart: JSON.stringify(
				items.map(({ productId, size, quantity, priceId, title }) => ({
					productId,
					title: title || 'Unknown',
					size,
					quantity,
					priceId,
				}))
			),
		};

		// Add individual item metadata fields (Stripe metadata keys are limited to 50 chars)
		items.forEach((item, idx) => {
			const itemNum = idx + 1;
			metadata[`item_${itemNum}_size`] = item.size || 'N/A';
			metadata[`item_${itemNum}_qty`] = String(item.quantity || 1);
			metadata[`item_${itemNum}_title`] = item.title || item.productId || 'Unknown';
			metadata[`item_${itemNum}_product`] = item.productId || 'Unknown';
		});

		const sessionCreateParams = {
			mode: 'payment',
			line_items,
			success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
			cancel_url: `${origin}/cart_review`,
			// Required if you want Checkout to collect shipping addresses.
			shipping_address_collection: { allowed_countries: allowedCountries },
			// Enable automatic tax calculation based on customer's shipping address
			automatic_tax: { enabled: true },
			// Metadata on the Checkout Session (visible in Checkout Sessions section)
			metadata,
			// Also add metadata to Payment Intent (visible in Payments section)
			payment_intent_data: {
				metadata,
			},
		};

		// Optional: show a specific Shipping Rate you configured in Stripe.
		// If you don't set this, Checkout can still collect a shipping address,
		// but won't show shipping options/rates.
		if (shippingRateId) {
			sessionCreateParams.shipping_options = [
				{ shipping_rate: shippingRateId },
			];
		}

		const session = await stripe.checkout.sessions.create(sessionCreateParams);

		return json({ url: session.url }, 200);
	} catch (err) {
		console.error('Stripe create-checkout-session error:', err);
		return json({ error: 'Unable to create checkout session' }, 500);
	}
}

// Small helper to respond JSON consistently
function json(body, status = 200) {
	return new Response(JSON.stringify(body), {
		status,
		headers: { 'content-type': 'application/json' },
	});
}

function getRequestOrigin(request) {
	const siteUrl = String(import.meta.env.SITE_URL || '').trim();
	const headerOrigin = String(request.headers.get('origin') || '').trim();
	const forwardedProto = String(
		request.headers.get('x-forwarded-proto') || ''
	).trim();
	const forwardedHost = String(
		request.headers.get('x-forwarded-host') || ''
	).trim();
	const host = String(request.headers.get('host') || '').trim();

	const candidates = [
		siteUrl,
		headerOrigin,
		// Some proxies only send forwarded headers
		forwardedProto && forwardedHost
			? `${forwardedProto}://${forwardedHost}`
			: '',
		forwardedProto && host ? `${forwardedProto}://${host}` : '',
		host ? `http://${host}` : '',
	];

	for (const candidate of candidates) {
		if (!candidate) continue;
		try {
			const url = new URL(candidate);
			return url.origin;
		} catch {}
	}

	try {
		const url = new URL(request.url);
		return url.origin;
	} catch {
		return '';
	}
}
