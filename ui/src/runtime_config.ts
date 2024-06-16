import type { RuntimeConfig } from "./types";


export function get_runtime_config(): RuntimeConfig | undefined {
  if (!window.hasOwnProperty('__PAPERMERGE_RUNTIME_CONFIG__')) {
    return undefined;
  }

  return window.__PAPERMERGE_RUNTIME_CONFIG__;
}


export function is_remote_user_enabled(): boolean {
  let config: RuntimeConfig | undefined = get_runtime_config();

  if (!config) {
    return false;
  }

  if (config.hasOwnProperty('remote_user')) {
    return true;
  }

  return false;
}


export function is_oidc_enabled(): boolean {
  let config: RuntimeConfig | undefined = get_runtime_config();

  if (!config) {
    return false;
  }

  if (config.hasOwnProperty('oidc')) {
    return true;
  }

  return false;
}
