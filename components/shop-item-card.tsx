import Image from 'next/image';
import { Package } from 'lucide-react';
import { Button } from './ui';
import type { ShopItem } from '@/types/domain';
export function ShopItemCard({ item }: {
    item: ShopItem;
}) { return <article className="equipment-card">{item.image ? <div className="equipment-image"><Image src={item.image} alt={`${item.manufacturer} ${item.model}`} fill sizes="(max-width: 700px) 100vw, 33vw"/></div> : <div className="equipment-placeholder"><Package size={48} strokeWidth={1}/><span>Item photography pending</span></div>}<div className="equipment-card-content"><div className="equipment-meta"><span>{item.manufacturer}</span><span>{item.sample ? 'Demo status: ' : ''}{item.status}</span></div><h3>{item.model}</h3><p>{item.description}</p><p>{item.condition}<br />Quantity: {item.quantity}</p><div className="rates"><div><span>PRICE</span>{item.price === null ? 'To be confirmed' : `$${item.price}`}</div></div>{item.status === 'Sold' ? <button className="button secondary" disabled>Sold</button> : <Button href={`/contact?item=${item.id}`}>{item.status === 'Pending' ? 'Ask about this item' : 'Contact to purchase'}</Button>}</div></article>; }
