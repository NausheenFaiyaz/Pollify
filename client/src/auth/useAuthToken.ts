import { useSyncExternalStore } from "react";
import { getToken, subscribeAuthChange } from "./oidc";

export const useAuthToken = () => useSyncExternalStore(subscribeAuthChange, getToken, getToken);
