export const prerender = false;

export async function POST() {
	return new Response(
		JSON.stringify({
			error: 'Not implemented: stripe webhook handler is empty.',
		}),
		{ status: 501, headers: { 'content-type': 'application/json' } }
	);
}

