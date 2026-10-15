/**
 * Marks the element whose width stands for the width a form has available — `FormShell`'s root box
 * in the generated views.
 *
 * A `FormTable` row decides between its inline and stacked layout from its own measured width, and
 * that measurement is impossible while the row sits inside something hiding it: a tab panel / wizard
 * step mounts every panel up front with the inactive ones under `display: none`, where the row has no
 * layout box at all. It keeps the width it last measured through that — a form's width does not
 * change because a tab was switched — and watches an element carrying this class to find out when
 * that assumption breaks (a window resize while the row waits on a hidden tab). See `FormTableRow`.
 *
 * It therefore has to sit **outside** whatever hides parts of the form, which is what makes it the
 * shell's own root rather than anything inside the form: an element that is hidden along with the row
 * reports no resize either, and would answer nothing.
 */
export const FORM_WIDTH_REFERENCE_CLASS = 'hab-form-width-reference';
