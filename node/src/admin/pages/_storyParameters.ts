// Every page story renders a real `BaseAdmin` shell with its own light/dark switch
// (`ColorModeToggle`, in the settings panel). Storybook's own backgrounds/theme toolbar control
// has no way to reach into that switch, so leaving it enabled just adds a second, disconnected
// toggle. `parameters.backgrounds.disable` hides the toolbar control while a story under this
// title is open — spread this into each page story's `meta.parameters`.
export const PAGE_STORY_PARAMETERS = {
  layout: 'fullscreen',
  backgrounds: {disable: true},
} as const;
