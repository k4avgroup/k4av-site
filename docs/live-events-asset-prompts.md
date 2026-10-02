# Live Events "How we work": prompts for ChatGPT

Each block is one prompt to paste into ChatGPT. Always attach the current board as a style reference.
Send the generated images and the JSON back; positions in the JSON are checked and corrected against the real images before use.

## Rules for every prompt (paste once at the start of the chat)

```text
I am building an animated website section. I need clean image assets and a JSON file that says where each asset goes.

General rules:
- Canvas is 1672 x 941 px (16:9). All JSON coordinates are normalized percentages 0-100 of that canvas: x from the left edge, y from the top edge, w = width as % of canvas width.
- Same camera angle, lighting and drawing style across all assets of a board, matching the attached reference.
- Every separate object (sprite) is its own PNG with a TRANSPARENT background. If transparency is not possible, use a flat solid magenta #FF00FF background, no shadow on it, no floor, no gradient.
- Sprites are fully visible, not cropped, with 8% empty margin, nothing touching the edge.
- No text, no logos, no labels anywhere unless I explicitly ask.
- Backgrounds ("plates") must be completely clean: no people, no props, nothing that I want to animate.
- Do not draw colors that I did not ask for.
- Return the JSON as a code block, with every asset file name exactly as listed.
```

## Board 1: "We build the sketch" (white pencil sketch, dark blueprint)

I will draw in: screens, tech tables, speakers, everything on the tech tables, two cameras. Chairs are removed.

```text
BOARD 1. Same style as the attached sketch: dark blueprint paper, thin white pencil / chalk linework.

1) Plate: board1-room.png (1672x941). The room only: walls, floor perspective, the stage platform with steps, the raised tech platform at the back of the room with its steps, two empty camera risers (left and right). Leave EMPTY: no screens on the stage (only the dark curtain / back wall), no podium, no speakers, no tables or equipment on the tech platform, NO chairs or seating anywhere, no cameras.

2) Sprites (same style, same camera angle, transparent PNG, each 1024x1024):
- board1-screen-left.png, board1-screen-center.png, board1-screen-right.png (a blank dark screen in a frame; the side ones slightly angled toward the audience)
- board1-speaker-array.png (a line array speaker stack, hanging)
- board1-podium.png
- board1-stage-monitor.png (a floor wedge)
- board1-table-audio.png, board1-table-video.png, board1-table-lighting.png (a tech table with equipment on top: mixing console / video switcher with monitors / lighting console, and an operator chair pushed in)
- board1-camera.png (a camera on a tripod)

3) JSON board1-layout.json with this exact shape:
{
  "canvas": { "width": 1672, "height": 941 },
  "items": [
    { "id": "screen-left", "file": "board1-screen-left.png", "x": 0, "y": 0, "w": 0, "anchor": "center", "z": 1, "order": 1 }
  ]
}
- x, y = where the sprite's anchor point sits on the plate; anchor is "center" or "bottom-center".
- order = the order they should appear while the sketch is built (1 first). Build order: stage items, screens, speakers, podium, monitors, tech tables, cameras.
- Also add "plateAnchors": the polygons (4 corner points [x,y]) of: stageFloor, techPlatformTop, cameraRiserLeft, cameraRiserRight.
Give an entry for every sprite. Positions must be where the objects belong in the room plate.
```

## Board 2: "We build the signal line diagram"

No new pictures are needed. It reuses the finished Board 1 (without chairs) and I draw the signal lines and moving pulses over it (video orange, audio blue, lighting white dashed, wireless orange dashed). The labels and legend stay.

If you want ChatGPT to double check the routes after Board 1 is assembled, send it a screenshot of the assembled board and ask:

```text
This is the assembled room. Return signal-routes.json: for each signal (video, audio, lighting, wireless) a list of routes, each route as a polyline of [x,y] points in 0-100 percent coordinates, from the source object to the destination object, using only horizontal and vertical segments, avoiding crossing equipment where possible. Name each route (e.g. "video-switcher-to-left-screen").
```

## Board 3: "We build the stage" (photographic black-and-white, like the current board)

I move the people and parts. Keep everything grayscale; no color anywhere except the test pattern, which is also black and white.

```text
BOARD 3. Same black-and-white photographic style, same camera angle and lighting as the attached board.

1) Plate: board3-plate.png (1672x941). The empty hall: stage platform, back curtain, side wall panels, the tech platform at the back with steps, floor. Leave EMPTY: no people, no road cases, no truss, no lights, no screens (the screens are dark rectangles only if they are part of the hall; otherwise nothing), no cables on the floor.

2) Sprites (transparent PNG, photographic grayscale, same scale and camera angle):
- Worker pushing a road case, TWO frames of the same person with the same case: board3-pusher-a.png and board3-pusher-b.png. Only the legs and arms differ (step 1 and step 2 of a walk). Hard hat, work clothes.
- board3-case-closed.png and board3-case-open.png (road case closed, and open with gear inside, no people)
- board3-worker-stand-a.png and board3-worker-stand-b.png (a worker standing, looking up; in b the head is tilted slightly higher)
- board3-watcher-a.png, board3-watcher-b.png (a second worker, different clothes, looking up, arms crossed; head slightly different in b)
- board3-truss-lights.png (a straight horizontal truss section with 6 stage lights mounted underneath, seen from the same angle; it will rise from the floor to the ceiling position)
- board3-lighting-tech-a.png and board3-lighting-tech-b.png (a worker at a lighting console with the arm down / the arm raised toward the light)
- board3-cameraman-a.png, board3-cameraman-b.png (a cameraman placing a camera on a tripod: standing upright / leaning slightly to adjust)
- board3-camera.png (camera on a tripod, no person)
- board3-projector.png (a projector on a stand, aimed at a screen)
- board3-screen.png (a blank screen on a stand)
- board3-testpattern-1.png, board3-testpattern-2.png, board3-testpattern-3.png (black and white test patterns, 16:9, flat, no text: color-bar style in grayscale, a fine grid with a circle, a checkerboard)

3) JSON board3-layout.json:
{
  "canvas": { "width": 1672, "height": 941 },
  "items": [
    { "id": "pusher", "frames": ["board3-pusher-a.png", "board3-pusher-b.png"], "w": 0,
      "path": [ { "x": 0, "y": 0 }, { "x": 0, "y": 0 } ], "anchor": "bottom-center", "z": 3 },
    { "id": "truss", "file": "board3-truss-lights.png", "w": 0, "from": { "x": 0, "y": 0 }, "to": { "x": 0, "y": 0 }, "anchor": "center", "z": 2 }
  ],
  "screens": [ { "id": "screen-center", "quad": [[0,0],[0,0],[0,0],[0,0]] } ],
  "projectorBeam": { "from": { "x": 0, "y": 0 }, "toScreen": "screen-center" }
}
- "path" = where the sprite walks (start, end). "from"/"to" = where the truss starts on the floor and where it ends hanging.
- Every item needs its own entry. Order of the story: 1 case is pushed in; 2 two cases stand open/closed, two workers watch; 3 the truss with lights is raised; 4 the lighting tech works, the lights blink red and blue (I add the color blink as light overlays, so do not paint it); 5 the cameraman places a camera; 6 the projector lights the screen and the test patterns switch.
```

## Board 4: "We run the show" (color photo)

I move the screens, the lights and the presenter. Make three operators clearly different from each other.

```text
BOARD 4. Same color photographic style, same camera angle and lighting as the attached board.

1) Plate: board4-plate.png (1672x941). The same ballroom with the audience, truss, line arrays, stage lights, podium, three operators at the control desks and two camera operators, BUT:
   - The three screens are BLANK: flat dark gray rectangles in their frames (I will play the slides on them).
   - The presenter is NOT in the picture (empty podium).
   - The three operators at the desks must look clearly different from one another: different hair (short dark, long hair in a ponytail, shaved head or cap), different build, different clothes color accents, each wearing a headset and the "K4AV GROUP" shirt. Different skin tones are welcome.
   - The audience can stay as is.

2) Sprites (transparent PNG, same scale and angle):
- board4-presenter-a.png, board4-presenter-b.png, board4-presenter-c.png, board4-presenter-d.png: the same presenter at the podium, upper body. a = arm down, looking left; b = right arm raised, looking at the audience; c = both hands open, looking right; d = pointing at the screen, looking left. The same person, same suit, only the pose and the head turn change.
- board4-slide-1.png ... board4-slide-4.png: four 16:9 slides to play on the screens: abstract company presentation visuals (big chart, photo of a skyline, a number tiles slide, a roadmap), no readable text, bright blue accents.

3) JSON board4-layout.json:
{
  "canvas": { "width": 1672, "height": 941 },
  "screens": [ { "id": "screen-left", "quad": [[0,0],[0,0],[0,0],[0,0]] }, { "id": "screen-center", "quad": [[0,0],[0,0],[0,0],[0,0]] }, { "id": "screen-right", "quad": [[0,0],[0,0],[0,0],[0,0]] } ],
  "presenter": { "frames": ["board4-presenter-a.png", "board4-presenter-b.png", "board4-presenter-c.png", "board4-presenter-d.png"], "x": 0, "y": 0, "w": 0, "anchor": "bottom-center" },
  "lights": [ { "id": "light-1", "x": 0, "y": 0 } ],
  "operators": [ { "id": "audio", "x": 0, "y": 0 }, { "id": "video", "x": 0, "y": 0 }, { "id": "lighting", "x": 0, "y": 0 } ]
}
- "quad" = the four corners of each blank screen, clockwise from top-left.
- "lights" = the position of every visible stage light on the truss (I put the changing light color on them).
```

## How it will be animated (for reference)

- Board 1: items appear one by one in `order` (a fast pencil-draw wipe).
- Board 2: the Board 1 scene fades in at once, the lines draw and the pulses run immediately, the labels appear at once.
- Board 3: pusher walks (frames a/b switched while moving), watchers look up while the truss rises with the lights on strips, the lighting tech's arm moves and the lights blink red/blue, the cameraman places the camera, the projector beam lights the screen and the black-and-white test patterns switch.
- Board 4: slides change on the three screens, the presenter pose frames cycle (arm up and down, head left and right) in sync with the slides, the stage lights slowly change color.
