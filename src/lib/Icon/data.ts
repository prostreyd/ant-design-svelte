/*
 * The one file that imports the icon data package (rule 6b, `ai/dependencies.md`, criterion 3): the ready icon
 * components import their drawing from here, so the package can be replaced without a change of the public API.
 * `@ant-design/icons-svg` is MIT, 848 drawings, no dependencies, `sideEffects: false`; a bundler keeps only the
 * drawings that are imported. It is imported from its root, not from `es/asn/*`: the root works in plain Node
 * (server rendering) and the deep ES files do not.
 */
export * from '@ant-design/icons-svg';
