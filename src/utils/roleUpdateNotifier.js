// Utility để thông báo khi có cập nhật quyền user
export const notifyRoleUpdate = () => {
  // Dispatch custom event để thông báo cho OrganizationSelector refresh
  const event = new CustomEvent('userRoleUpdated');
  window.dispatchEvent(event);
};

// Utility để refresh organization selector từ bên ngoài
export const refreshOrganizationSelector = (organizationSelectorRef) => {
  if (organizationSelectorRef?.current?.refreshOrganizations) {
    organizationSelectorRef.current.refreshOrganizations();
  }
};