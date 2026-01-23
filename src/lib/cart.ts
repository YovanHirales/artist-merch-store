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
	const cart = getCart();

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

	item.priceId =
		priceIdTable[item.productId as keyof typeof priceIdTable][item.size];

	const existing = cart.find((x) => x.priceId === item.priceId);
	if (existing) {
		existing.qty += item.qty;
	} else {
		cart.push(item);
	}

	setCart(cart);
}

export function clearCart() {
	if (typeof window === 'undefined') return;
	window.localStorage.removeItem(CART_KEY);
	window.dispatchEvent(new Event('cart-update'));
}
