export type Service = {
    slug: string;
    title: string;
    short: string;
    description: string;
    deliverables: string[];
    enabled: boolean;
};
export type Project = {
    slug: string;
    title: string;
    industry: string;
    location: string;
    service: string;
    technologies: string[];
    summary: string;
    challenge: string;
    solution: string;
    result: string;
    image: string;
    sample: boolean;
};
export type Equipment = {
    id: string;
    manufacturer: string;
    model: string;
    category: string;
    description: string;
    specifications: string[];
    image: string | null;
    dailyPrice: number | null;
    weeklyPrice: number | null;
    quantity: number;
    availability: 'On request' | 'Available' | 'Unavailable';
    condition: string;
    accessories?: string[];
    sample: boolean;
};
export type ShopItem = {
    id: string;
    manufacturer: string;
    model: string;
    description: string;
    condition: string;
    price: number | null;
    quantity: number;
    status: 'Available' | 'Pending' | 'Sold';
    image: string | null;
    sample: boolean;
};
export type RentalLine = {
    equipmentId: string;
    quantity: number;
};
// Future modules intentionally contain contracts only; no public admin implementation.
export type Client = {
    id: string;
    userId: string;
    company: string;
    name: string;
};
export type Job = {
    id: string;
    clientId: string;
    title: string;
    status: 'planned' | 'active' | 'complete';
};
export type Invoice = {
    id: string;
    clientId: string;
    jobId?: string;
    currency: string;
    totalMinor: number;
    status: 'draft' | 'issued' | 'paid';
};
