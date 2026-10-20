const now = new Date();
// `version` changes on every build; added to stylesheet and script URLs so a
// deploy is never shown with yesterday's cached styles.
export default { year: now.getFullYear(), version: now.getTime().toString(36) };
