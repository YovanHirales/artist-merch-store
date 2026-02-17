export type CartItem = {
	productId: string;
	title: string;
	priceId: string;
	price: number;
	size: 'S' | 'M' | 'L' | 'XL';
	qty: number;
	imgUrl: string;
};

const CART_KEY = 'local_cart';

export function getCart(): CartItem[] {
	if (typeof window === 'undefined') return [];
	try {
		const raw = window.localStorage.getItem(CART_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw);
		return Array.isArray(parsed) ? parsed : [];
	} catch {
		return [];
	}
}

export function setCart(items: CartItem[]) {
	if (typeof window === 'undefined') return;
	window.localStorage.setItem(CART_KEY, JSON.stringify(items));
	window.dispatchEvent(new Event('cart-update'));
}

export function addToCart(item: CartItem) {
	const PRODUCT_HOODIE = import.meta.env.PUBLIC_PRODUCT_HOODIE;
	const PRODUCT_TEE = import.meta.env.PUBLIC_PRODUCT_TEE;

	const priceIdTable = {
		// Hoodie
		[PRODUCT_HOODIE]: {
			S: import.meta.env.PUBLIC_PRICE_HOODIE_S,
			M: import.meta.env.PUBLIC_PRICE_HOODIE_M,
			L: import.meta.env.PUBLIC_PRICE_HOODIE_L,
			XL: import.meta.env.PUBLIC_PRICE_HOODIE_XL,
		},
		// Tee
		[PRODUCT_TEE]: {
			S: import.meta.env.PUBLIC_PRICE_TEE_S,
			M: import.meta.env.PUBLIC_PRICE_TEE_M,
			L: import.meta.env.PUBLIC_PRICE_TEE_L,
			XL: import.meta.env.PUBLIC_PRICE_TEE_XL,
		},
	};

	const priceIdBySize = priceIdTable[item.productId as keyof typeof priceIdTable];
	if (!priceIdBySize) return;

	const resolvedPriceId = priceIdBySize[item.size];
	if (!resolvedPriceId) return;

	// Never mutate caller-owned `item` or existing cart rows in place.
	// Build a new cart array from the latest localStorage snapshot.
	const cart = getCart();
	const existing = cart.find((x) => x.priceId === resolvedPriceId);

	const nextCart = existing
		? cart.map((x) =>
				x.priceId === resolvedPriceId ? { ...x, qty: x.qty + item.qty } : x
			)
		: [...cart, { ...item, priceId: resolvedPriceId }];

	setCart(nextCart);
}

export function clearCart() {
	if (typeof window === 'undefined') return;
	window.localStorage.removeItem(CART_KEY);
	window.dispatchEvent(new Event('cart-update'));
}
