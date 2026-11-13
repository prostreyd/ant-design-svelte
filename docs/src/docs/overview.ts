// The picture on the card of every component on the components overview page: a silhouette drawn in
// `components/Wireframe.svelte` (blue lines for a ready component, grey dashes for a planned one). A test keeps this
// list in step with the roadmap in `pages.ts`, so a component that is added there cannot get a card without a picture.

/** Every component of the roadmap, the ready ones first. */
export const WIREFRAMES = [
  'Button',
  'Input',
  'Checkbox',
  'Switch',
  'Select',
  'Typography',
  'Icon',
  'Menu',
  'Dropdown',
  'Radio',
  'DatePicker',
  'Form',
  'Table',
  'Tooltip',
  'Modal',
  'Drawer',
  'Message',
  'Notification'
] as const;
