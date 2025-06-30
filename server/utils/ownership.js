import { OWNER_ID, COOWNERS } from "../configs/owner.js";

export const isOwnerOrCoOwner = (userId) => {
  return userId === OWNER_ID || COOWNERS.includes(userId);
};