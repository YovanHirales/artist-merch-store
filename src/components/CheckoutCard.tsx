import { useEffect, useState } from 'react';
import { getCart, setCart, type CartItem } from '../lib/cart';

export default function CheckoutCard() {
	const [cartItems, setCartItems] = useState<CartItem[]>([]);
	const [isCheckingOut, setIsCheckingOut] = useState(false);
	const [checkoutError, setCheckoutError] = useState<string | null>(null);

	useEffect(() => {
		const loadCart = () => {
			setCartItems(getCart());
		};

		loadCart();

		const handleCartUpdate = () => {
			loadCart();
		};

		window.addEventListener('cart-update', handleCartUpdate);
		window.addEventListener('storage', handleCartUpdate);

		return () => {
			window.removeEventListener('cart-update', handleCartUpdate);
			window.removeEventListener('storage', handleCartUpdate);
		};
	}, []);

	const removeItem = (priceId: string) => {
		const updated = cartItems.filter((item) => item.priceId !== priceId);
		setCart(updated);
		setCartItems(updated);
	};

	const updateQuantity = (priceId: string, newQty: number) => {
		if (newQty <= 0) {
			removeItem(priceId);
			return;
		}
		const updated = cartItems.map((item) =>
			item.priceId === priceId ? { ...item, qty: newQty } : item
		);
		setCart(updated);
		setCartItems(updated);
	};

	if (cartItems.length === 0) {
		return (
			<div className='w-full text-center'>
				<p className='font-RockSalt text-2xl'>Your cart is empty</p>
			</div>
		);
	}

	async function handleCheckout() {
		try {
			setIsCheckingOut(true);
			setCheckoutError(null);

			const res = await fetch('/api/create-checkout-session', {
				method: 'POST',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify({
					items: cartItems.map((item) => ({
						priceId: item.priceId,
						quantity: item.qty,
						productId: item.productId,
						size: item.size,
						title: item.title,
					})),
				}),
			});

			const data = await res.json().catch(() => ({}));
			if (!res.ok) throw new Error(data?.error || 'Checkout failed');

			window.location.assign(data.url);
		} catch (e: any) {
			setCheckoutError(e?.message || 'Checkout failed');
			setIsCheckingOut(false);
		}
	}

	return (
		<div className='flex flex-col gap-4 w-full'>
			{cartItems.map((item) => (
				<div
					className='card card-side bg-primary shadow-none w-full'
					key={item.priceId}
				>
					{/* Card image */}
					<figure className='w-30 h-30'>
						<img src={item.imgUrl} />
					</figure>
					{/* Card body */}
					<div className='card-body p-2 mr-2 justify-around'>
						<div className='flex justify-between items-center'>
							<p className=''>{item.title}</p>
							<p className='text-right'>${item.price}</p>
						</div>
						<div className='flex justify-between items-center'>
							<p className=''>size</p>
							<p className=' text-right'>{item.size}</p>
						</div>
						<div className='flex justify-between items-center'>
							<p className=''>qty</p>
							<div className='flex items-center gap-2'>
								<button
									className='btn btn-primary btn-sm border-none hover:bg-primary hover:shadow-none'
									onClick={() => updateQuantity(item.priceId, item.qty + 1)}
								>
									+
								</button>
								<p className=''>{item.qty}</p>
								<button
									className='btn btn-primary btn-sm border-none hover:bg-primary hover:shadow-none pr-0'
									onClick={() => updateQuantity(item.priceId, item.qty - 1)}
								>
									-
								</button>
							</div>
						</div>
					</div>
				</div>
			))}
			<div className='flex-col items-center w-full p-4'>
				<div className='flex justify-between items-center'>
					<p className=''>Subtotal</p>
					<p className='text-right'>
						${cartItems.reduce((acc, item) => acc + item.price * item.qty, 0)}
					</p>
				</div>
				<div className='flex justify-between items-center'>
					<p className=''>Shipping</p>
					<p className='text-right'>CALCULATED AT CHECKOUT</p>
				</div>
				<div className='flex justify-between items-center'>
					<p className=''>Tax</p>
					<p className='text-right'>CALCULATED AT CHECKOUT</p>
				</div>
				<div className='flex justify-between items-center mt-2 font-bold'>
					<p className=''>Total</p>
					<p className='text-right'>
						${cartItems.reduce((acc, item) => acc + item.price * item.qty, 0)}
					</p>
				</div>
			</div>
			<div className='flex-col items-center w-full p-4'>
				<p className='font-bold'>stripe checkout</p>
				<div className='flex-col items-center w-full p-4'>
					{checkoutError && <p className='text-error mb-2'>{checkoutError}</p>}
				</div>
				<button
					className='btn w-full text-white font-bold'
					onClick={handleCheckout}
					disabled={isCheckingOut}
				>
					{isCheckingOut ? 'REDIRECTING...' : 'CHECKOUT'}
				</button>
			</div>
		</div>
	);
}
