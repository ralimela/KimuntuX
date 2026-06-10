/** Shared responsive breakpoints — laptop / tablet / mobile */
export const BP = {
  mobile: '480px',
  tablet: '768px',
  laptop: '1024px',
  desktop: '1280px',
};

export const media = {
  mobile: `@media (max-width: ${BP.mobile})`,
  tablet: `@media (max-width: ${BP.tablet})`,
  laptop: `@media (max-width: ${BP.laptop})`,
  desktop: `@media (max-width: ${BP.desktop})`,
};

/** Reusable CRM page padding */
export const crmPagePadding = `
  padding: 20px;
  @media (max-width: ${BP.tablet}) {
    padding: 16px 12px;
  }
  @media (max-width: ${BP.mobile}) {
    padding: 12px 10px;
  }
`;

/** Marketing pages under fixed header */
export const marketingTopPadding = `
  padding-top: 120px;
  @media (max-width: ${BP.tablet}) {
    padding-top: 100px;
  }
  @media (max-width: ${BP.mobile}) {
    padding-top: 88px;
  }
`;
