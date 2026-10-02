import { EstimateFillOverlay } from './estimate-fill-overlay';
import { ShowScene, SignalScene, SketchScene, StageScene } from './events-scenes';
import { Plate } from './scene';

// Live Events "How we work". Each board is a plate (the empty room) with sprites and overlays on it:
// 0 sketch, 1 signal line diagram, 2 stage build, 3 live show, 4 show estimate.
export function EventsGraphic({ index, label }: { index: number; label: string }) {
  return (
    <div className={`graphic g-${index}`} role="img" aria-label={label}>
      {index === 0 && <SketchScene />}
      {index === 1 && <SignalScene />}
      {index === 2 && <StageScene />}
      {index === 3 && <ShowScene />}
      {index === 4 && (
        <div className="sc">
          <Plate src="/images/graphics/board-estimate.webp" priority />
          <EstimateFillOverlay delay={700} />
        </div>
      )}
    </div>
  );
}
