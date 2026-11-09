import type { Lang } from '#docs/i18n';

export const load = ({ params }: { params: { lang?: string } }): { lang: Lang } => ({
  lang: (params.lang as Lang | undefined) ?? 'en'
});
