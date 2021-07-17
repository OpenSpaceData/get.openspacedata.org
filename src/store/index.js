import { writable } from 'svelte/store';

export const category = writable();
export const choice = writable();
export const location = writable();
export const range = writable({});