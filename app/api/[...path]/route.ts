import {handle} from '../../../server/next-handler';
export const runtime='nodejs';
export const dynamic='force-dynamic';
export const GET=handle;
export const POST=handle;
export const PUT=handle;

export const DELETE=handle;
export const PATCH=handle;
export const OPTIONS=handle;
export const HEAD=handle;
