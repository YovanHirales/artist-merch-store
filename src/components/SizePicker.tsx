import { useState } from 'react';
import { addToCart, type CartItem } from '../lib/cart';
import type { CartItem as CartItemType } from '../lib/cart';

export default function SizePicker({
	productId,
	title,
	price,
	imgUrl,
}: {
	productId: string;
	title: string;
	price: number;
	imgUrl: string;
}) {
	const [size, setSize] = useState('');

	const disabled = size === '';

	return (
		<div className='flex gap-2'>
			<select
				className='select select-bordered'
				value={size}
				onChange={(e) => setSize(e.target.value)}
			>
				<option value='' disabled>
					Size
				</option>
				<option value='S'>S</option>
				<option value='M'>M</option>
				<option value='L'>L</option>
				<option value='XL'>XL</option>
			</select>

			<button
				className='btn btn-primary'
				onClick={() =>
					addToCart({
						productId: productId,
						title: title,
						price: price,
						size: size as 'S' | 'M' | 'L' | 'XL',
						qty: 1,
						priceId: '',
						imgUrl: imgUrl,
					} as CartItemType)
				}
				disabled={disabled}
			>
				Add to Cart
			</button>
		</div>
	);
}
