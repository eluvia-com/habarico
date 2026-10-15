// Type-level contract test (HAB-685). The schema `UploadFieldOptions` (wire type) and the foundation
// `UploadTransportConfig` (transport contract) are intentionally *separate* declarations so neither
// layer imports the other. They must nevertheless stay mutually assignable — this file fails
// `npm run typecheck` the moment they drift apart. It is compiled by tsconfig but never bundled
// (nothing imports it) and is ignored by vitest (the `.test-d.ts` suffix does not match `*.test.ts`).
import type {UploadTransportConfig} from '@foundation/utils/upload';
import type {UploadFieldOptions} from '@schema/types';

// Both directions must type-check:
const _transportFromOptions: UploadTransportConfig = {} as UploadFieldOptions;
const _optionsFromTransport: UploadFieldOptions = {} as UploadTransportConfig;
