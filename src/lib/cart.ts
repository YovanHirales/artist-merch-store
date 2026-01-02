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
		console.log('cart', parsed);
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

	const priceIdTable = {
		// Hoodie
		prod_TNN00mtYK7DPx8: {
			S: 'price_1SkvhUQUcTF9g5AtwjzUCTlS',
			M: 'price_1SkvhjQUcTF9g5AtlAq8cnXX',
			L: 'price_1SkvhvQUcTF9g5AtM423MFy3',
			XL: 'price_1SkIDAQUcTF9g5AtJjkTieqq',
		},
		// Tee
		prod_Tf2DdwjhTzLsCj: {
			S: 'price_1Shi9OQUcTF9g5AtFPfcP132',
			M: 'price_1SkGL1QUcTF9g5At9SzhcMqo',
			L: 'price_1SkGLxQUcTF9g5AtOa5HtEOe',
			XL: 'price_1SkGMVQUcTF9g5AtAdmdnN8F',
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
