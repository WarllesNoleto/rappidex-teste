/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useEffect, useMemo, useState } from "react";

import { DeliveryContext } from "../../context/DeliveryContext";
import api, { API_URL } from "../../services/api";
import { Loader } from "../../components/Loader";
import { User } from "../../shared/interfaces";
import {
  formatIfoodHistoryDateTime,
  translateIfoodOperationType,
} from "../../shared/utils/ifoodHistory.ts";
import {
  Actions,
  CreditButton,
  CreditButtons,
  CreditInput,
  CreditLine,
  CreditSummary,
  Card,
  Checkbox,
  Container,
  Content,
  Input,
  LoadingContainer,
  MerchantIdLabel,
  SaveButton,
  ShopkeeperName,
  Subtitle,
  Title,
  HistoryButton,
  HistoryItem,
  HistoryList,
  LoadMoreButton,
  EmptyState,
  HelpText,
} from "./styles.ts";

export function IfoodClients() {
  const { token } = useContext(DeliveryContext);
  api.defaults.headers.Authorization = `Bearer ${token}`;

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [savingUser, setSavingUser] = useState("");
  const [savingIntegration, setSavingIntegration] = useState("");
  const [shopkeepers, setShopkeepers] = useState<User[]>([]);
  const [creditAmountByUser, setCreditAmountByUser] = useState<
    Record<string, number>
  >({});
  const [historyByUser, setHistoryByUser] = useState<Record<string, any[]>>({});
  const [loadingHistoryUser, setLoadingHistoryUser] = useState("");
  const [page, setPage] = useState(1);
  const [hasMoreShopkeepers, setHasMoreShopkeepers] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");

  const anotaAiWebhookUrl = `${API_URL}/anota-ai/webhook`;
  const anotaAiWebhookPath = "/api/anota-ai/webhook";
  const saiposWebhookUrl = `${API_URL}/saipos/webhook`;
  const saiposWebhookPath = "/api/saipos/webhook";

  const filteredShopkeepers = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    if (!normalizedSearch) {
      return shopkeepers;
    }

    return shopkeepers.filter((shopkeeper) =>
      (shopkeeper.name || "").toLowerCase().includes(normalizedSearch),
    );
  }, [shopkeepers, searchTerm]);

  const ITEMS_PER_PAGE = 200;

  async function loadShopkeepers(targetPage = 1, shouldAppend = false) {
    if (shouldAppend) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const usersResponse = await api.get(
        `/user?type=shopkeeper&page=${targetPage}&itemsPerPage=${ITEMS_PER_PAGE}`,
      );
      const users = Array.isArray(usersResponse.data?.data)
        ? usersResponse.data.data
        : [];

      setShopkeepers((currentUsers) =>
        shouldAppend ? [...currentUsers, ...users] : users,
      );
      setPage(targetPage);
      setHasMoreShopkeepers(users.length === ITEMS_PER_PAGE);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Erro ao buscar lojistas.");
    } finally {
      if (shouldAppend) {
        setLoadingMore(false);
      } else {
        setLoading(false);
      }
    }
  }

  async function loadAllShopkeepers() {
    setIsSearching(true);

    try {
      let targetPage = 1;
      let hasMore = true;
      const allUsers: User[] = [];

      while (hasMore) {
        const usersResponse = await api.get(
          `/user?type=shopkeeper&page=${targetPage}&itemsPerPage=${ITEMS_PER_PAGE}`,
        );

        const users = Array.isArray(usersResponse.data?.data)
          ? usersResponse.data.data
          : [];

        allUsers.push(...users);
        hasMore = users.length === ITEMS_PER_PAGE;
        targetPage += 1;
      }

      setShopkeepers(allUsers);
      setPage(1);
      setHasMoreShopkeepers(false);
    } catch (error: any) {
      alert(error?.response?.data?.message || "Erro ao buscar lojistas.");
    } finally {
      setIsSearching(false);
    }
  }

  function updateLocalUser(userId: string, changes: Partial<User>) {
    setShopkeepers((currentUsers) =>
      currentUsers.map((shopkeeper) =>
        shopkeeper.id === userId ? { ...shopkeeper, ...changes } : shopkeeper,
      ),
    );
  }

  function handleCopyWebhookInfo(value: string, label: string) {
    if (!navigator.clipboard) {
      alert("Não foi possível copiar automaticamente neste navegador.");
      return;
    }

    navigator.clipboard
      .writeText(value)
      .then(() => alert(`${label} copiado.`))
      .catch(() => alert(`Não foi possível copiar ${label.toLowerCase()}.`));
  }

  function resolveLegacyMerchantId(
    merchantId: string,
    merchants: User["ifoodMerchants"] = [],
  ) {
    const normalizedLegacyMerchantId = String(merchantId || "").trim();
    if (normalizedLegacyMerchantId) {
      return normalizedLegacyMerchantId;
    }

    const firstActiveMerchantId = (
      Array.isArray(merchants) ? merchants : []
    ).find(
      (merchant) =>
        merchant?.enabled !== false &&
        String(merchant?.merchantId || "").trim(),
    )?.merchantId;

    return String(firstActiveMerchantId || "").trim();
  }

  function getSavingKey(shopkeeperId: string, integration: string) {
    return `${shopkeeperId}:${integration}`;
  }

  async function handleSaveIfoodIntegration(shopkeeper: User) {
    const savingKey = getSavingKey(shopkeeper.id, "ifood");
    if (savingIntegration === savingKey) {
      return;
    }

    const merchants = Array.isArray(shopkeeper.ifoodMerchants)
      ? shopkeeper.ifoodMerchants
          .map((merchant) => ({
            ...merchant,
            merchantId: String(merchant.merchantId || "").trim(),
            name: String(merchant.name || "").trim(),
            pickupAddress: String(merchant.pickupAddress || "").trim(),
          }))
          .filter((merchant) => merchant.merchantId)
      : [];
    const merchantId = resolveLegacyMerchantId(
      shopkeeper.ifoodMerchantId || "",
      merchants,
    );
    if (
      shopkeeper.useIfoodIntegration &&
      !merchantId &&
      merchants.length === 0
    ) {
      alert("Informe o Merchant ID para ativar a integração iFood.");
      return;
    }

    setSavingIntegration(savingKey);

    try {
      const response = await api.put(`/user/${shopkeeper.id}`, {
        useIfoodIntegration: Boolean(shopkeeper.useIfoodIntegration),
        usesExternalIfoodPdv:
          Boolean(shopkeeper.useIfoodIntegration) &&
          Boolean(shopkeeper.usesExternalIfoodPdv),
        ifoodMerchantId: merchantId,
        ifoodMerchants: merchants,
      });

      if (response.data) {
        updateLocalUser(shopkeeper.id, response.data);
      }

      if (shopkeeper.useIfoodIntegration) {
        await api
          .post(`/ifood/sync-company/${shopkeeper.id}`)
          .catch(() => undefined);
      }

      alert("Integração iFood salva com sucesso.");
    } catch (error: any) {
      alert(
        error?.response?.data?.message || "Erro ao salvar integração iFood.",
      );
    } finally {
      setSavingIntegration((currentSavingIntegration) =>
        currentSavingIntegration === savingKey ? "" : currentSavingIntegration,
      );
    }
  }

  async function handleSaveAnotaAiIntegration(shopkeeper: User) {
    const savingKey = getSavingKey(shopkeeper.id, "anota-ai");
    if (savingIntegration === savingKey) {
      return;
    }

    setSavingIntegration(savingKey);

    try {
      const response = await api.put(`/user/${shopkeeper.id}`, {
        anotaAiEnabled: Boolean(shopkeeper.anotaAiEnabled),
        anotaAiStoreId: String(shopkeeper.anotaAiStoreId || "").trim(),
        anotaAiToken: String(shopkeeper.anotaAiToken || "").trim(),
        anotaAiIgnoreIfoodOrders: shopkeeper.anotaAiIgnoreIfoodOrders !== false,
      });

      if (response.data) {
        updateLocalUser(shopkeeper.id, response.data);
      }

      alert("Integração Anota AI salva com sucesso.");
    } catch (error: any) {
      alert(
        error?.response?.data?.message || "Erro ao salvar integração Anota AI.",
      );
    } finally {
      setSavingIntegration((currentSavingIntegration) =>
        currentSavingIntegration === savingKey ? "" : currentSavingIntegration,
      );
    }
  }

  async function handleSaveSaiposIntegration(shopkeeper: User) {
    const savingKey = getSavingKey(shopkeeper.id, "saipos");
    if (savingIntegration === savingKey) {
      return;
    }

    const saiposStoreId = String(shopkeeper.saiposStoreId || "").trim();
    const saiposMerchantId =
      String(shopkeeper.saiposMerchantId || "").trim() || saiposStoreId;

    if (shopkeeper.saiposEnabled && !saiposStoreId && !saiposMerchantId) {
      alert("Informe o ID da loja ou Merchant ID da Saipos.");
      return;
    }

    setSavingIntegration(savingKey);

    try {
      const response = await api.put(`/user/${shopkeeper.id}`, {
        saiposEnabled: Boolean(shopkeeper.saiposEnabled),
        saiposStoreId,
        saiposMerchantId,
        saiposToken: String(shopkeeper.saiposToken || "").trim(),
      });

      if (response.data) {
        updateLocalUser(shopkeeper.id, response.data);
      }

      alert("Integração Saipos salva com sucesso.");
    } catch (error: any) {
      alert(
        error?.response?.data?.message || "Erro ao salvar integração Saipos.",
      );
    } finally {
      setSavingIntegration((currentSavingIntegration) =>
        currentSavingIntegration === savingKey ? "" : currentSavingIntegration,
      );
    }
  }

  function updateCreditAmount(userId: string, value: string) {
    const parsedValue = Number(value);

    setCreditAmountByUser((current) => ({
      ...current,
      [userId]: Number.isNaN(parsedValue) ? 0 : parsedValue,
    }));
  }

  async function handleCreditAdjustment(
    shopkeeper: User,
    action: "add" | "remove",
  ) {
    if (savingUser) {
      return;
    }

    const amount = Number(creditAmountByUser[shopkeeper.id] || 0);
    if (!amount || amount < 1) {
      alert("Informe uma quantidade válida de créditos.");
      return;
    }

    setSavingUser(shopkeeper.user);

    try {
      const response = await api.post(
        `/ifood/credits/company/${shopkeeper.id}/${action}`,
        {
          amount,
        },
      );

      updateLocalUser(shopkeeper.id, {
        ifoodOrdersReleased:
          response.data?.ifoodOrdersReleased ?? shopkeeper.ifoodOrdersReleased,
        ifoodOrdersUsed:
          response.data?.ifoodOrdersUsed ?? shopkeeper.ifoodOrdersUsed,
        ifoodOrdersAvailable:
          response.data?.ifoodOrdersAvailable ??
          shopkeeper.ifoodOrdersAvailable,
      });

      alert(
        `Créditos ${action === "add" ? "adicionados" : "removidos"} com sucesso.`,
      );
    } catch (error: any) {
      alert(error?.response?.data?.message || "Erro ao ajustar créditos.");
    } finally {
      setSavingUser("");
    }
  }

  async function handleLoadHistory(shopkeeper: User) {
    setLoadingHistoryUser(shopkeeper.id);
    try {
      const response = await api.get(
        `/ifood/credits/company/${shopkeeper.id}/history`,
      );
      setHistoryByUser((current) => ({
        ...current,
        [shopkeeper.id]: Array.isArray(response.data?.history)
          ? response.data.history
          : [],
      }));
    } catch (error: any) {
      alert(error?.response?.data?.message || "Erro ao carregar histórico.");
    } finally {
      setLoadingHistoryUser("");
    }
  }

  useEffect(() => {
    loadShopkeepers();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) {
      return;
    }

    if (hasMoreShopkeepers && !isSearching) {
      loadAllShopkeepers();
    }
  }, [searchTerm, hasMoreShopkeepers, isSearching]);

  async function handleLoadMoreShopkeepers() {
    if (loading || loadingMore || !hasMoreShopkeepers) {
      return;
    }

    await loadShopkeepers(page + 1, true);
  }

  return (
    <Container>
      <Content>
        <Title>Empresas Cadastradas</Title>
        <Subtitle>
          Configure as integrações iFood, Anota AI e Saipos de cada lojista sem
          alterar o fluxo atual de entregas.
        </Subtitle>

        <Input
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Pesquisar empresa por nome"
          value={searchTerm}
        />

        {loading || isSearching ? (
          <LoadingContainer>
            <Loader size={40} biggestColor="green" smallestColor="gray" />
          </LoadingContainer>
        ) : filteredShopkeepers.length === 0 ? (
          <EmptyState>Nenhuma empresa encontrada para este nome.</EmptyState>
        ) : (
          filteredShopkeepers.map((shopkeeper) => (
            <Card key={shopkeeper.id}>
              <ShopkeeperName>{shopkeeper.name}</ShopkeeperName>

              <Actions>
                <Checkbox>
                  <input
                    checked={Boolean(shopkeeper.useIfoodIntegration)}
                    onChange={(event) =>
                      updateLocalUser(shopkeeper.id, {
                        useIfoodIntegration: event.target.checked,
                        usesExternalIfoodPdv: event.target.checked
                          ? Boolean(shopkeeper.usesExternalIfoodPdv)
                          : false,
                        ifoodMerchantId: event.target.checked
                          ? shopkeeper.ifoodMerchantId
                          : "",
                      })
                    }
                    type="checkbox"
                  />
                  Usar integração iFood
                </Checkbox>

                {shopkeeper.useIfoodIntegration && (
                  <Checkbox>
                    <input
                      checked={Boolean(shopkeeper.usesExternalIfoodPdv)}
                      onChange={(event) =>
                        updateLocalUser(shopkeeper.id, {
                          usesExternalIfoodPdv: event.target.checked,
                        })
                      }
                      type="checkbox"
                    />
                    Usa PDV externo integrado ao iFood?
                  </Checkbox>
                )}

                <div>
                  <MerchantIdLabel htmlFor={`merchant-${shopkeeper.id}`}>
                    Merchant ID (legado)
                  </MerchantIdLabel>
                  <Input
                    disabled={!shopkeeper.useIfoodIntegration}
                    id={`merchant-${shopkeeper.id}`}
                    onChange={(event) =>
                      updateLocalUser(shopkeeper.id, {
                        ifoodMerchantId: event.target.value,
                      })
                    }
                    placeholder="Compatibilidade com cadastro antigo"
                    value={shopkeeper.ifoodMerchantId || ""}
                  />
                </div>
                <div>
                  <MerchantIdLabel>Lojas iFood vinculadas</MerchantIdLabel>
                  {(shopkeeper.ifoodMerchants || []).map((merchant, index) => (
                    <div
                      key={`${shopkeeper.id}-${index}`}
                      style={{
                        border: "1px solid #555",
                        borderRadius: 8,
                        padding: 10,
                        marginBottom: 8,
                      }}
                    >
                      <Input
                        disabled={!shopkeeper.useIfoodIntegration}
                        placeholder="Nome da loja"
                        value={merchant.name || ""}
                        onChange={(event) =>
                          updateLocalUser(shopkeeper.id, {
                            ifoodMerchants: (
                              shopkeeper.ifoodMerchants || []
                            ).map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, name: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                      <Input
                        disabled={!shopkeeper.useIfoodIntegration}
                        placeholder="Merchant ID"
                        value={merchant.merchantId || ""}
                        onChange={(event) =>
                          updateLocalUser(shopkeeper.id, {
                            ifoodMerchants: (
                              shopkeeper.ifoodMerchants || []
                            ).map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, merchantId: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                      <Input
                        disabled={!shopkeeper.useIfoodIntegration}
                        placeholder="Endereço de coleta (opcional)"
                        value={merchant.pickupAddress || ""}
                        onChange={(event) =>
                          updateLocalUser(shopkeeper.id, {
                            ifoodMerchants: (
                              shopkeeper.ifoodMerchants || []
                            ).map((item, itemIndex) =>
                              itemIndex === index
                                ? { ...item, pickupAddress: event.target.value }
                                : item,
                            ),
                          })
                        }
                      />
                      <Checkbox>
                        <input
                          disabled={!shopkeeper.useIfoodIntegration}
                          type="checkbox"
                          checked={merchant.enabled !== false}
                          onChange={(event) =>
                            updateLocalUser(shopkeeper.id, {
                              ifoodMerchants: (
                                shopkeeper.ifoodMerchants || []
                              ).map((item, itemIndex) =>
                                itemIndex === index
                                  ? { ...item, enabled: event.target.checked }
                                  : item,
                              ),
                            })
                          }
                        />{" "}
                        Ativa
                      </Checkbox>
                      <CreditButton
                        type="button"
                        onClick={() =>
                          updateLocalUser(shopkeeper.id, {
                            ifoodMerchants: (
                              shopkeeper.ifoodMerchants || []
                            ).filter((_, itemIndex) => itemIndex !== index),
                          })
                        }
                      >
                        Remover loja
                      </CreditButton>
                    </div>
                  ))}
                  <CreditButton
                    type="button"
                    disabled={!shopkeeper.useIfoodIntegration}
                    onClick={() => {
                      const updatedMerchants = [
                        ...(shopkeeper.ifoodMerchants || []),
                        {
                          merchantId: "",
                          name: "",
                          enabled: true,
                          pickupAddress: "",
                        },
                      ];
                      updateLocalUser(shopkeeper.id, {
                        ifoodMerchants: updatedMerchants,
                        ifoodMerchantId: resolveLegacyMerchantId(
                          shopkeeper.ifoodMerchantId || "",
                          updatedMerchants,
                        ),
                      });
                    }}
                  >
                    Adicionar loja iFood
                  </CreditButton>
                </div>

                <SaveButton
                  disabled={
                    savingIntegration === getSavingKey(shopkeeper.id, "ifood")
                  }
                  onClick={() => handleSaveIfoodIntegration(shopkeeper)}
                  type="button"
                >
                  {savingIntegration === getSavingKey(shopkeeper.id, "ifood")
                    ? "Salvando iFood..."
                    : "Salvar iFood"}
                </SaveButton>

                <div
                  style={{
                    border: "1px solid #2f855a",
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <ShopkeeperName>Anota AI</ShopkeeperName>
                  <Checkbox>
                    <input
                      checked={Boolean(shopkeeper.anotaAiEnabled)}
                      onChange={(event) =>
                        updateLocalUser(shopkeeper.id, {
                          anotaAiEnabled: event.target.checked,
                          anotaAiIgnoreIfoodOrders:
                            shopkeeper.anotaAiIgnoreIfoodOrders !== false,
                        })
                      }
                      type="checkbox"
                    />
                    Ativar integração Anota AI
                  </Checkbox>

                  <MerchantIdLabel htmlFor={`anota-store-${shopkeeper.id}`}>
                    Root / ID interno da loja Anota AI
                  </MerchantIdLabel>
                  <Input
                    disabled={!shopkeeper.anotaAiEnabled}
                    id={`anota-store-${shopkeeper.id}`}
                    onChange={(event) =>
                      updateLocalUser(shopkeeper.id, {
                        anotaAiStoreId: event.target.value,
                      })
                    }
                    placeholder="Ex.: Root informado pela Anota AI"
                    value={shopkeeper.anotaAiStoreId || ""}
                  />

                  <MerchantIdLabel htmlFor={`anota-token-${shopkeeper.id}`}>
                    Token da Anota AI
                  </MerchantIdLabel>
                  <Input
                    disabled={!shopkeeper.anotaAiEnabled}
                    id={`anota-token-${shopkeeper.id}`}
                    onChange={(event) =>
                      updateLocalUser(shopkeeper.id, {
                        anotaAiToken: event.target.value,
                      })
                    }
                    placeholder="Token da loja Anota AI"
                    value={shopkeeper.anotaAiToken || ""}
                  />
                  {shopkeeper.anotaAiEnabled &&
                    !String(shopkeeper.anotaAiToken || "").trim() && (
                      <HelpText role="alert">
                        Esta loja está com Anota AI ativa, mas sem token próprio
                        salvo. Cadastre o token da loja; o ANOTA_AI_TOKEN global
                        é apenas fallback opcional.
                      </HelpText>
                    )}

                  <Checkbox>
                    <input
                      checked={shopkeeper.anotaAiIgnoreIfoodOrders !== false}
                      disabled={!shopkeeper.anotaAiEnabled}
                      onChange={(event) =>
                        updateLocalUser(shopkeeper.id, {
                          anotaAiIgnoreIfoodOrders: event.target.checked,
                        })
                      }
                      type="checkbox"
                    />
                    Ignorar pedidos iFood vindos da Anota AI
                  </Checkbox>

                  <CreditSummary>
                    <CreditLine>
                      Status: {shopkeeper.anotaAiEnabled ? "Ativa" : "Inativa"}
                    </CreditLine>
                    <CreditLine>
                      URL completa do webhook: {anotaAiWebhookUrl}
                    </CreditLine>
                    <CreditLine>
                      Caminho/path para o portal da Anota AI:{" "}
                      {anotaAiWebhookPath}
                    </CreditLine>
                    <CreditLine>
                      Root: usado somente para vincular a loja Anota AI ao
                      lojista Rappidex.
                    </CreditLine>
                  </CreditSummary>
                  <CreditButtons>
                    <CreditButton
                      onClick={() =>
                        handleCopyWebhookInfo(anotaAiWebhookUrl, "URL completa")
                      }
                      type="button"
                    >
                      Copiar URL completa
                    </CreditButton>
                    <CreditButton
                      onClick={() =>
                        handleCopyWebhookInfo(anotaAiWebhookPath, "Caminho")
                      }
                      type="button"
                    >
                      Copiar caminho
                    </CreditButton>
                  </CreditButtons>

                  <SaveButton
                    disabled={
                      savingIntegration ===
                      getSavingKey(shopkeeper.id, "anota-ai")
                    }
                    onClick={() => handleSaveAnotaAiIntegration(shopkeeper)}
                    type="button"
                  >
                    {savingIntegration ===
                    getSavingKey(shopkeeper.id, "anota-ai")
                      ? "Salvando Anota AI..."
                      : "Salvar Anota AI"}
                  </SaveButton>

                  <Subtitle>
                    Se o portal da Anota AI pedir URL completa, use a URL
                    completa. Se pedir apenas o caminho do webhook, use
                    /api/anota-ai/webhook. Cadastre a informação correta nos
                    campos Pedidos Realizados, Pedidos Atualizados e Pedidos
                    Cancelados do portal da Anota AI.
                  </Subtitle>
                </div>

                <div
                  style={{
                    border: "1px solid #f59e0b",
                    borderRadius: 8,
                    padding: 12,
                  }}
                >
                  <ShopkeeperName>Saipos</ShopkeeperName>

                  <Checkbox>
                    <input
                      checked={Boolean(shopkeeper.saiposEnabled)}
                      onChange={(event) =>
                        updateLocalUser(shopkeeper.id, {
                          saiposEnabled: event.target.checked,
                          saiposStoreId: event.target.checked
                            ? shopkeeper.saiposStoreId
                            : "",
                          saiposMerchantId: event.target.checked
                            ? shopkeeper.saiposMerchantId
                            : "",
                          saiposToken: event.target.checked
                            ? shopkeeper.saiposToken
                            : "",
                        })
                      }
                      type="checkbox"
                    />
                    Ativar integração Saipos
                  </Checkbox>

                  <MerchantIdLabel htmlFor={`saipos-store-${shopkeeper.id}`}>
                    ID da Loja Saipos
                  </MerchantIdLabel>
                  <Input
                    disabled={!shopkeeper.saiposEnabled}
                    id={`saipos-store-${shopkeeper.id}`}
                    onChange={(event) =>
                      updateLocalUser(shopkeeper.id, {
                        saiposStoreId: event.target.value,
                      })
                    }
                    placeholder="Ex.: 91080"
                    value={shopkeeper.saiposStoreId || ""}
                  />

                  <MerchantIdLabel htmlFor={`saipos-merchant-${shopkeeper.id}`}>
                    Merchant ID Saipos
                  </MerchantIdLabel>
                  <Input
                    disabled={!shopkeeper.saiposEnabled}
                    id={`saipos-merchant-${shopkeeper.id}`}
                    onChange={(event) =>
                      updateLocalUser(shopkeeper.id, {
                        saiposMerchantId: event.target.value,
                      })
                    }
                    placeholder="Opcional. Se vazio, usa o ID da loja."
                    value={shopkeeper.saiposMerchantId || ""}
                  />

                  <MerchantIdLabel htmlFor={`saipos-token-${shopkeeper.id}`}>
                    Token Saipos
                  </MerchantIdLabel>
                  <Input
                    disabled={!shopkeeper.saiposEnabled}
                    id={`saipos-token-${shopkeeper.id}`}
                    onChange={(event) =>
                      updateLocalUser(shopkeeper.id, {
                        saiposToken: event.target.value,
                      })
                    }
                    placeholder="Token opcional para validar webhook"
                    value={shopkeeper.saiposToken || ""}
                  />

                  <CreditSummary>
                    <CreditLine>
                      Status: {shopkeeper.saiposEnabled ? "Ativa" : "Inativa"}
                    </CreditLine>
                    <CreditLine>
                      URL completa do webhook: {saiposWebhookUrl}
                    </CreditLine>
                    <CreditLine>Caminho/path: {saiposWebhookPath}</CreditLine>
                    <CreditLine>
                      O ID da Loja Saipos é usado para vincular o pedido
                      recebido ao lojista correto.
                    </CreditLine>
                  </CreditSummary>

                  <CreditButtons>
                    <CreditButton
                      onClick={() =>
                        handleCopyWebhookInfo(
                          saiposWebhookUrl,
                          "URL completa Saipos",
                        )
                      }
                      type="button"
                    >
                      Copiar URL completa
                    </CreditButton>

                    <CreditButton
                      onClick={() =>
                        handleCopyWebhookInfo(
                          saiposWebhookPath,
                          "Caminho Saipos",
                        )
                      }
                      type="button"
                    >
                      Copiar caminho
                    </CreditButton>
                  </CreditButtons>

                  <SaveButton
                    disabled={
                      savingIntegration === getSavingKey(shopkeeper.id, "saipos")
                    }
                    onClick={() => handleSaveSaiposIntegration(shopkeeper)}
                    type="button"
                  >
                    {savingIntegration === getSavingKey(shopkeeper.id, "saipos")
                      ? "Salvando Saipos..."
                      : "Salvar Saipos"}
                  </SaveButton>

                  <Subtitle>
                    No painel Saipos Developer, cadastre a URL completa do
                    webhook:
                    {` ${saiposWebhookUrl}`}
                  </Subtitle>
                </div>

                <CreditSummary>
                  <CreditLine>
                    Liberados: {shopkeeper.ifoodOrdersReleased || 0}
                  </CreditLine>
                  <CreditLine>
                    Utilizados: {shopkeeper.ifoodOrdersUsed || 0}
                  </CreditLine>
                  <CreditLine>
                    Disponíveis: {shopkeeper.ifoodOrdersAvailable || 0}
                  </CreditLine>
                </CreditSummary>

                <CreditButtons>
                  <CreditInput
                    min={1}
                    onChange={(event) =>
                      updateCreditAmount(shopkeeper.id, event.target.value)
                    }
                    placeholder="Qtd. créditos"
                    type="number"
                    value={creditAmountByUser[shopkeeper.id] || ""}
                  />
                  <CreditButton
                    disabled={savingUser === shopkeeper.user}
                    onClick={() => handleCreditAdjustment(shopkeeper, "add")}
                    type="button"
                  >
                    + Créditos
                  </CreditButton>
                  <CreditButton
                    disabled={savingUser === shopkeeper.user}
                    onClick={() => handleCreditAdjustment(shopkeeper, "remove")}
                    type="button"
                  >
                    - Créditos
                  </CreditButton>
                  <HistoryButton
                    disabled={loadingHistoryUser === shopkeeper.id}
                    onClick={() => handleLoadHistory(shopkeeper)}
                    type="button"
                  >
                    {loadingHistoryUser === shopkeeper.id
                      ? "Carregando..."
                      : "Ver histórico"}
                  </HistoryButton>
                </CreditButtons>
              </Actions>


              {Array.isArray(historyByUser[shopkeeper.id]) &&
                historyByUser[shopkeeper.id]?.length > 0 && (
                  <HistoryList>
                    {historyByUser[shopkeeper.id]
                      .slice(0, 5)
                      .map((entry: any) => (
                        <HistoryItem key={entry.id}>
                          {(() => {
                            const formattedDateTime =
                              formatIfoodHistoryDateTime(entry.createdAt);

                            return (
                              <>
                                {translateIfoodOperationType(
                                  entry.operationType,
                                )}{" "}
                                {entry.amount} crédito(s) em{" "}
                                {`${formattedDateTime.date} ${formattedDateTime.time}`}
                              </>
                            );
                          })()}
                        </HistoryItem>
                      ))}
                  </HistoryList>
                )}
            </Card>
          ))
        )}

        {!loading && !searchTerm.trim() && hasMoreShopkeepers && (
          <LoadMoreButton
            disabled={loadingMore}
            onClick={handleLoadMoreShopkeepers}
            type="button"
          >
            {loadingMore ? "Carregando..." : "Mostrar mais empresas"}
          </LoadMoreButton>
        )}
      </Content>
    </Container>
  );
}
