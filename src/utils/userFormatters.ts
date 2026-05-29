import { User, UserRow } from '../types';

export const formatUserForTable = (user: User, showArchived: boolean): UserRow => {
  const hasChavruta = (user.matchTo || 0) < (user.prefNumberOfMatches || 0) ? "No" : "Yes";
  const registrationDate = new Date(user.dateOfRegistered || user._createdDate || '');
  const isValidRegistrationDate = !Number.isNaN(registrationDate.getTime());
  const formattedRegistrationDate = isValidRegistrationDate
    ? registrationDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    : '';
  const registrationYear = isValidRegistrationDate
    ? registrationDate.getFullYear().toString()
    : '';
  
  return {
    id: user._id || "",
    fullName: user.fullName || "",
    country: user.country || "",
    hasChavruta,
    details: "View",
    contactDetails: "",
    edit: "edit",
    notes: "",
    archive: showArchived ? "↑ Unarchive" : "↓ Archive",
    delete: "Delete",
    registrationDate: formattedRegistrationDate,
    registrationYear
  };
};

export const formatUsersForTable = (users: User[], showArchived: boolean): UserRow[] => {
  return users.map(user => formatUserForTable(user, showArchived));
};
