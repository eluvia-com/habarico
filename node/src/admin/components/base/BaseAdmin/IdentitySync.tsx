import {UserIdentity} from 'react-admin';
import {useSyncIdentity} from '@admin/hooks/useSyncIdentity';

type IdentitySyncProps = {
  onChange: (identity: UserIdentity | undefined) => void;
};

// Renders nothing; carries React Admin's identity up to `BaseAdmin`, which scopes the per-user
// store to it. Must sit inside the React Admin context. Internal to the `BaseAdmin/` folder.
export const IdentitySync = ({onChange}: IdentitySyncProps) => {
  useSyncIdentity(onChange);
  return null;
};
