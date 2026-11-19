/** The boxes of the open notifications, in the order of the page. */
export const boxes = () => [...document.querySelectorAll<HTMLElement>('.ads-notification')];

const flat = (text: string | null | undefined) => text?.replace(/\s+/g, ' ').trim();

/** The title of each box (with the hidden type word) with white space collapsed. */
export const titles = () => boxes().map((box) => flat(box.querySelector('.ads-notification-title')?.textContent));

/** The lists of the places that are drawn. */
export const lists = () => [...document.querySelectorAll<HTMLElement>('.ads-notification-list')];

/** The boxes of one place, in the order they are drawn. */
export const inPlace = (placement: string) =>
  [...document.querySelectorAll<HTMLElement>(`.ads-notification-list[data-placement="${placement}"] .ads-notification`)];

/** The titles of one place, in the order they are drawn. */
export const titlesIn = (placement: string) => inPlace(placement).map((box) => flat(box.querySelector('.ads-notification-title')?.textContent));

export const slots = () => [...document.querySelectorAll<HTMLElement>('.ads-notification-slot')];
