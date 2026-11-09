import { defineParams } from '@sveltejs/kit/params';

/** English lives at the site root; Russian and Chinese get a /ru/ and /zh/ prefix. */
export const params = defineParams({
  lang: (param) => (param === 'ru' || param === 'zh' ? param : undefined)
});
