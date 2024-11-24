import { useInsertScriptTags } from '@keycloakify/svelte/tools/useInsertScriptTags';
import { assert } from 'keycloakify/tools/assert';
import { waitForElementMountedOnDom } from 'keycloakify/tools/waitForElementMountedOnDom';
import { onMount } from 'svelte';
import type { KcContext } from '../KcContext';

type KcContextLike = {
  url: {
    resourcesPath: string;
  };
  isUserIdentified: boolean | 'true' | 'false';
  challenge: string;
  userVerification: string;
  rpId: string;
  createTimeout: number | string;
};

assert<keyof KcContextLike extends keyof KcContext.LoginPasskeysConditionalAuthenticate ? true : false>();
assert<KcContext.LoginPasskeysConditionalAuthenticate extends KcContextLike ? true : false>();

type I18nLike = {
  msgStr: (key: 'webauthn-unsupported-browser-text' | 'passkey-unsupported-browser-text') => string;
  isFetchingTranslations: boolean;
};

export function useScript(params: { authButtonId: string; kcContext: KcContextLike; i18n: I18nLike }) {
  const { authButtonId, kcContext, i18n } = params;

  const { url, isUserIdentified, challenge, userVerification, rpId, createTimeout } = kcContext;

  const { msgStr, isFetchingTranslations } = i18n;

  const { insertScriptTags } = useInsertScriptTags({
    componentOrHookName: 'LoginRecoveryAuthnCodeConfig',
    scriptTags: [
      {
        type: 'module',
        textContent: () => `
                    import { authenticateByWebAuthn } from "${url.resourcesPath}/js/webauthnAuthenticate.js";
                    import { initAuthenticate } from "${url.resourcesPath}/js/passkeysConditionalAuth.js";

                    const authButton = document.getElementById("${authButtonId}");
                    const input = {
                        isUserIdentified : ${isUserIdentified},
                        challenge : ${JSON.stringify(challenge)},
                        userVerification : ${JSON.stringify(userVerification)},
                        rpId : ${JSON.stringify(rpId)},
                        createTimeout : ${createTimeout}
                    };
                    authButton.addEventListener("click", () => {
                        authenticateByWebAuthn({
                            ...input,
                            errmsg : ${JSON.stringify(msgStr('webauthn-unsupported-browser-text'))}
                        });
                    });

                    initAuthenticate({
                        ...input,
                        errmsg : ${JSON.stringify(msgStr('passkey-unsupported-browser-text'))}
                    });
                `,
      },
    ],
  });

  onMount(() => {
    // TODO: check reactivity
    if (isFetchingTranslations) {
      return;
    }

    (async () => {
      await waitForElementMountedOnDom({
        elementId: authButtonId,
      });

      insertScriptTags();
    })();
  });
}
