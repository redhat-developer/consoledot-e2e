import { APIRequestContext, request } from '@playwright/test';
import { config } from '@lib/config';

const COMPONENTS = [
  'application-services',
  'rhoas-guides-build',
  'rhosak-control-plane-ui-build',
  'rhosak-data-plane-ui-build',
  'sr-ui-build',
  'srs-ui-build'
];
/**
 * Get component hash from API
 * @param component UI component
 * @param request APIRequestContext
 * @return component build hash
 */
const mk_get_src_hash = async function (component: string, request: APIRequestContext) {
  const url = new URL(config.startingPage);
  url.pathname = `/apps/${component}/app.info.json`;

  const response = await request.get(url.toString(), { ignoreHTTPSErrors: true });

  let respBody = await response.text();

  respBody = JSON.parse(respBody);

  return respBody['src_hash'];
};

/**
 * Get versions of all tested components. The midstream hash (src_hash) is the component version.
 * @param request APIRequestContext
 * @return: An object with the src_hash of each component
 */
const mk_get_components_versions = async function (request: APIRequestContext) {
  const versions = {};

  for (const c of COMPONENTS) {
    versions[c] = await mk_get_src_hash(c, request);
  }

  return versions;
};

export const component_versions = async function () {
  const apiContext = await request.newContext({
    baseURL: config.startingPage
  });

  return await mk_get_components_versions(apiContext);
};
