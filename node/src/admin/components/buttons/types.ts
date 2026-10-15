// What a trigger reports once it is done. `navigated` is set when the trigger itself left for
// another route (a same-tab redirect): the caller must not follow up with a navigation of its own,
// or it would override the trigger's.
export type ActionTriggerResult = {
  navigated?: boolean;
};

export type BaseActionTriggerProps = {
  onDone?: (result?: ActionTriggerResult) => void;
};
