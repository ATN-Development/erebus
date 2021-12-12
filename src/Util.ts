import { promisify } from "util";

export const setPromiseTimeout = promisify(setTimeout);
