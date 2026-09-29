import Image from 'next/image';
import { Package, Plus } from 'lucide-react';
import type { Equipment } from '@/types/domain';
export function EquipmentCard({ equipment: e, onAdd, disabled }: {
    equipment: Equipment;
    onAdd: () => void;
    disabled: boolean;
}) { return <article className="equipment-card">{e.image ? <div className="equipment-image"><Image src={e.image} alt={`${e.manufacturer} ${e.model}`} fill sizes="(max-width: 700px) 50vw, 30vw"/></div> : <div className="equipment-placeholder"><Package size={42} strokeWidth={1}/><span>Equipment photo pending</span></div>}<div className="equipment-card-content"><div className="equipment-meta"><span>{e.category}</span><span>{e.sample ? 'Sample catalog' : e.availability}</span></div><h3>{e.model}</h3><p>{e.manufacturer} · {e.description}</p><div className="rates"><div><span>DAILY</span>{e.dailyPrice === null ? 'Request pricing' : `$${e.dailyPrice}`}</div><div><span>WEEKLY</span>{e.weeklyPrice === null ? 'Request pricing' : `$${e.weeklyPrice}`}</div></div><details><summary>Specifications & package</summary><ul>{e.specifications.map(x => <li key={x}>{x}</li>)}</ul><p>Condition: {e.condition}<br />Status: {e.availability}<br />Request limit: {e.quantity}{e.sample ? ' (demo)' : ''}</p><p>{e.accessories?.join(' · ')}</p></details><button className="button" onClick={onAdd} disabled={disabled || e.availability === 'Unavailable'} aria-label={`Add ${e.model} to rental request`}>{disabled ? 'Request limit reached' : 'Add to rental request'}<Plus size={16}/></button></div></article>; }
