import adminUserRoles from './adminUser/roles'
import foodRoles from './food/roles'

const roles = {
  ...adminUserRoles,
  ...foodRoles
}

export default roles
