import React, { useMemo, useState } from "react";
import { LLMModelProvider } from "../client/api";
import { RECOMMENDED_MODELS } from "../constant";
import { Avatar } from "./emoji";
import styles from "./model-selector.module.scss";

// Sentinel provider name for the curated "Recommended" section in the sidebar.
const RECOMMENDED_PROVIDER = "Recommended";

type ModelItem = {
  available: boolean;
  name: string;
  displayName: string;
  sorted: number;
  provider?: LLMModelProvider;
  isDefault?: boolean;
  category?: string;
};

interface ModelSelectorProps {
  models: ModelItem[];
  currentValue: string; // "modelName@providerName"
  onSelection: (value: string) => void;
  onClose: () => void;
}

export function ModelSelector(props: ModelSelectorProps) {
  const { models, currentValue, onSelection, onClose } = props;
  const [searchQuery, setSearchQuery] = useState("");

  // Group models by provider
  const providers = useMemo(() => {
    const map = new Map<string, { name: string; sorted: number }>();
    for (const m of models) {
      const pName = m.provider?.providerName ?? "Other";
      if (!map.has(pName)) {
        map.set(pName, { name: pName, sorted: m.provider?.sorted ?? 999 });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.sorted - b.sorted);
  }, [models]);

  // Curated "Recommended" models, in RECOMMENDED_MODELS order, matched by name
  // against the available models (first available match per name wins).
  const recommendedModels = useMemo(() => {
    const seen = new Set<string>();
    const result: ModelItem[] = [];
    for (const name of RECOMMENDED_MODELS) {
      const m = models.find((mm) => mm.name === name);
      if (m && !seen.has(m.name)) {
        seen.add(m.name);
        result.push(m);
      }
    }
    return result;
  }, [models]);

  const hasRecommended = recommendedModels.length > 0;

  // Provider sidebar entries, with "Recommended" pinned to the top when present.
  const sidebarProviders = useMemo(
    () =>
      hasRecommended
        ? [{ name: RECOMMENDED_PROVIDER, sorted: -1 }, ...providers]
        : providers,
    [hasRecommended, providers],
  );

  // Determine initially selected provider: open on "Recommended" when available,
  // otherwise fall back to the current model's provider.
  const initialProvider = useMemo(() => {
    if (hasRecommended) return RECOMMENDED_PROVIDER;
    const [, providerName] = currentValue.split(/@(?!.*@)/);
    return providerName || providers[0]?.name || "";
  }, [hasRecommended, currentValue, providers]);

  const [selectedProvider, setSelectedProvider] = useState(initialProvider);

  // Filter models by search and selected provider
  const filteredModels = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return models.filter((m) => {
      const pName = m.provider?.providerName ?? "Other";
      if (q) {
        // When searching, show all providers
        const displayName = (m.displayName || m.name).toLowerCase();
        const provider = pName.toLowerCase();
        return (
          displayName.includes(q) ||
          provider.includes(q) ||
          m.name.toLowerCase().includes(q)
        );
      }
      return pName === selectedProvider;
    });
  }, [models, selectedProvider, searchQuery]);

  // The list shown in the right panel (Recommended is a curated cross-provider set).
  const visibleModels =
    !searchQuery.trim() && selectedProvider === RECOMMENDED_PROVIDER
      ? recommendedModels
      : filteredModels;

  // Provider counts for search results
  const searchProviderCounts = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const counts = new Map<string, number>();
    for (const m of filteredModels) {
      const p = m.provider?.providerName ?? "Other";
      counts.set(p, (counts.get(p) || 0) + 1);
    }
    return counts;
  }, [filteredModels, searchQuery]);

  // Group filtered models by provider when searching
  const groupedSearchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const groups = new Map<string, ModelItem[]>();
    for (const m of filteredModels) {
      const p = m.provider?.providerName ?? "Other";
      if (!groups.has(p)) groups.set(p, []);
      groups.get(p)!.push(m);
    }
    return groups;
  }, [filteredModels, searchQuery]);

  return (
    <div className={styles["modal-mask"]} onClick={onClose}>
      <div
        className={styles["modal-container"]}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search bar */}
        <div className={styles["search-bar"]}>
          <input
            type="text"
            className={styles["search-input"]}
            placeholder="Search models..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div className={styles["selector-body"]}>
          {/* Provider list (left panel) */}
          {!searchQuery.trim() && (
            <div className={styles["provider-list"]}>
              {sidebarProviders.map((p) => (
                <div
                  key={p.name}
                  className={`${styles["provider-item"]} ${
                    selectedProvider === p.name ? styles["provider-active"] : ""
                  } ${
                    p.name === RECOMMENDED_PROVIDER
                      ? styles["provider-recommended"]
                      : ""
                  }`}
                  onClick={() => setSelectedProvider(p.name)}
                >
                  {p.name === RECOMMENDED_PROVIDER ? (
                    <>
                      <span className={styles["rec-star"]}>★</span>
                      Recommended
                    </>
                  ) : (
                    p.name
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Model list (right panel) */}
          <div className={styles["model-list"]}>
            {searchQuery.trim() ? (
              // Search results grouped by provider
              groupedSearchResults && groupedSearchResults.size > 0 ? (
                Array.from(groupedSearchResults.entries()).map(
                  ([provider, pModels]) => (
                    <div key={provider}>
                      <div className={styles["model-group-header"]}>
                        {provider} ({pModels.length})
                      </div>
                      {pModels.map((m) => (
                        <ModelItemRow
                          key={`${m.name}@${m.provider?.providerName}`}
                          model={m}
                          isSelected={
                            `${m.name}@${m.provider?.providerName}` ===
                            currentValue
                          }
                          onClick={() => {
                            onSelection(
                              `${m.name}@${m.provider?.providerName}`,
                            );
                            onClose();
                          }}
                        />
                      ))}
                    </div>
                  ),
                )
              ) : (
                <div className={styles["no-results"]}>No models found</div>
              )
            ) : (
              // Normal provider view (or the curated Recommended set)
              visibleModels.map((m) => (
                <ModelItemRow
                  key={`${m.name}@${m.provider?.providerName}`}
                  model={m}
                  isSelected={
                    `${m.name}@${m.provider?.providerName}` === currentValue
                  }
                  onClick={() => {
                    onSelection(`${m.name}@${m.provider?.providerName}`);
                    onClose();
                  }}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ModelItemRow(props: {
  model: ModelItem;
  isSelected: boolean;
  onClick: () => void;
}) {
  const { model, isSelected, onClick } = props;
  const displayName = model.displayName || model.name;

  return (
    <div
      className={`${styles["model-item"]} ${
        isSelected ? styles["model-item-selected"] : ""
      }`}
      onClick={onClick}
    >
      <div className={styles["model-icon"]}>
        <Avatar model={model.name} />
      </div>
      <div className={styles["model-info"]}>
        <div className={styles["model-name"]}>{displayName}</div>
        {model.category && (
          <div className={styles["model-category"]}>{model.category}</div>
        )}
      </div>
      {isSelected && <div className={styles["model-selected-dot"]} />}
    </div>
  );
}
