import type { Spec } from '@json-render/core';

/** Message part type for structured spec (e.g. from pipeJsonRender). Shared with backend. */
export const DATA_SPEC_PART_TYPE = 'data-spec';

/** Type guard: value has root (string) and elements (object). */
export function isValidSpec(spec: unknown): spec is Spec {
  return (
    spec != null &&
    typeof spec === 'object' &&
    'root' in spec &&
    typeof (spec as Spec).root === 'string' &&
    'elements' in spec &&
    (spec as Spec).elements != null &&
    typeof (spec as Spec).elements === 'object'
  );
}
