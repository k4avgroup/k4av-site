'use client';
import dynamic from 'next/dynamic';

// The 3D library is only loaded on this page, and only in the browser.
const RoomPlanner = dynamic(() => import('./room-planner'), {
  ssr: false,
  loading: () => (
    <p className="planner-loading" role="status">
      Loading the 3D planner…
    </p>
  ),
});

export function PlannerLoader() {
  return <RoomPlanner />;
}
