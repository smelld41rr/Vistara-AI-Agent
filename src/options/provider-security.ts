// Keys are ordinary isolated chrome.storage.local data, not encrypted. Endpoint changes use a new provider identity.
import { normalizeCompatibleUrl } from '@src/llm';
import { keysStorage, providersStorage, settingsStorage, withBaseUrl } from '@src/store/settings';
import { newId } from '@src/store/conversations';
export async function changeProviderEndpoint(id: string, rawUrl: string, confirmed: boolean): Promise<void> {
  if (!confirmed) throw new Error('Endpoint change requires explicit confirmation.');
  const url = normalizeCompatibleUrl(rawUrl);
  let replacement: string | undefined;
  await providersStorage.set(list =>
    list.map(p => {
      if (p.id !== id || (p.baseUrl ?? '') === url) return p;
      replacement = newId();
      return { ...withBaseUrl(p, url), id: replacement };
    }),
  );
  if (!replacement) return;
  await keysStorage.set(({ [id]: _removed, ...rest }) => rest);
  const nextId = replacement;
  await settingsStorage.set(s => ({
    ...s,
    defaultModel: s.defaultModel?.providerId === id ? { ...s.defaultModel, providerId: nextId } : s.defaultModel,
    voiceModel: s.voiceModel?.providerId === id ? null : s.voiceModel,
  }));
}

/** A key captured by an old card can never be stored on the new provider identity. */
export async function saveProviderKey(id: string, baseUrl: string | undefined, value: string): Promise<void> {
  const fresh = (await providersStorage.get()).find(p => p.id === id && (p.baseUrl ?? '') === (baseUrl ?? ''));
  if (!fresh) throw new Error('Provider endpoint changed; save the key again for the current provider.');
  await keysStorage.set(keys => {
    const rest = { ...keys };
    delete rest[id];
    return value.trim() ? { ...rest, [id]: value.trim() } : rest;
  });
  await providersStorage.set(list =>
    list.map(p =>
      p.id === id
        ? {
            ...p,
            credentialRevision: (p.credentialRevision ?? 0) + 1,
            models: p.models.map(({ name, overrides }) => ({ name, ...(overrides ? { overrides } : {}) })),
          }
        : p,
    ),
  );
}
