import {Identifier} from 'react-admin';
import {ViewType} from '@schema/types';

export type ChangeViewProps = {
  resource: string;
  viewName: string;
  actionName?: string;
  viewType: ViewType;
  id?: Identifier;
  data?: Record<string, string>;
  replace?: boolean;
};

// Schema-view routing half of the context (the presentation / overlay surface lives in the admin
// layer as `ViewPresentationContext`). Carries where we are (`resource`, `id`, `data`) and how to
// move (`changeView`, `prevView`).
export type SchemaViewRouterContextProps = ChangeViewProps & {
  changeView?: (props: ChangeViewProps) => boolean;
  prevView?: () => boolean;
  // Closes the overlay this view is rendered in. Set only by an overlay surface, so its absence is
  // what tells a caller there is no overlay here - unlike `prevView`, whose page meaning is a
  // navigation of its own and must not stand in for closing.
  closeOverlay?: () => void;
};

export type SchemaViewRouterContextState = {
  resource: string;
  id?: Identifier;
  data?: Record<string, string>;
  changeView?: (props: ChangeViewProps) => boolean;
  prevView?: () => boolean;
  closeOverlay?: () => void;
};

export type SchemaViewRouterContextType = {
  resource: string;
  id?: Identifier;
  data?: Record<string, string>;
  changeView: (props: ChangeViewProps) => boolean;
  getViewLink: (props: ChangeViewProps) => string | undefined;
  prevView: () => boolean;
  // Undefined on a page surface: there is nothing to close there.
  closeOverlay?: () => void;
};
