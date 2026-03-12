import { withRole, type RoleHandler } from './withRole';

export const withAdmin = (handler: RoleHandler) => withRole(['ADMIN'], handler);

