// Rentals are scheduled in the business's Seattle time zone, not UTC.
export function currentRentalDate(now = new Date()): string {
    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Los_Angeles',
        year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(now);
}
