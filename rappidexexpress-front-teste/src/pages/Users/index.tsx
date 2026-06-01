import {
  useCallback,
  useContext,
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
} from "react";
import { useNavigate } from "react-router-dom";

import { DeliveryContext } from "../../context/DeliveryContext";
import api from "../../services/api";
import {
  Filter,
  Container,
  Content,
  HeaderFilter,
  UsersContainer,
  UserContainer,
  Username,
  UserInfo,
  IntegrationStatus,
  ConfigureButton,
  ModalActions,
  ModalBackdrop,
  ModalButton,
  ModalCard,
  ModalCheckboxLabel,
  ModalField,
  ModalInput,
  WebhookUrlBox,
  ContainerProfileImage,
  ProfileImage,
  ContainerLoading,
  LoadMoreButton,
} from "./styles";
import { Loader } from "../../components/Loader";
import { User } from "../../shared/interfaces";

type SaiposFormData = {
  saiposEnabled: boolean;
  saiposStoreId: string;
  saiposMerchantId: string;
  saiposToken: string;
};

const SAIPOS_WEBHOOK_URL =
  "https://rappidex-api2-91dbcacd3915.herokuapp.com/api/saipos/webhook";

export function Users() {
  const USERS_PAGE_SIZE = 100;
  const { token } = useContext(DeliveryContext);
  api.defaults.headers.Authorization = `Bearer ${token}`;

  const navigate = useNavigate();
  const [type, setType] = useState("shopkeeper");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [page, setPage] = useState(1);
  const [hasMoreUsers, setHasMoreUsers] = useState(false);
  const [selectedSaiposUser, setSelectedSaiposUser] = useState<User | null>(null);
  const [saiposFormData, setSaiposFormData] = useState<SaiposFormData>({
    saiposEnabled: false,
    saiposStoreId: "",
    saiposMerchantId: "",
    saiposToken: "",
  });
  const [savingSaipos, setSavingSaipos] = useState(false);

  const getData = useCallback(
    async (requestedPage: number) => {
      const usersResponse = await api.get(
        `/user?type=${type}&page=${requestedPage}&itemsPerPage=${USERS_PAGE_SIZE}`,
      );
      const currentPageUsers: User[] = usersResponse.data.data ?? [];

      if (requestedPage === 1) {
        setUsers(currentPageUsers);
      } else {
        setUsers((previousUsers) => [...previousUsers, ...currentPageUsers]);
      }

      setHasMoreUsers(currentPageUsers.length === USERS_PAGE_SIZE);
      setPage(requestedPage);
    },
    [type],
  );

  async function handleLoadMore() {
    try {
      setLoadingMore(true);
      await getData(page + 1);
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Erro ao carregar mais usuários.";
      alert(message);
    } finally {
      setLoadingMore(false);
    }
  }

  function handleMotoboys() {
    setLoading(true);
    setType("motoboy");
  }

  function handleShopkeeper() {
    setLoading(true);
    setType("shopkeeper");
  }

  function handleUser(user: string) {
    navigate(`/novo-usuario/${user}`);
  }

  function handleConfigureAnotaAi(
    event: MouseEvent<HTMLButtonElement>,
    username: string,
  ) {
    event.stopPropagation();
    navigate(`/novo-usuario/${username}#anota-ai`);
  }

  function handleConfigureSaipos(
    event: MouseEvent<HTMLButtonElement>,
    userToConfigure: User,
  ) {
    event.stopPropagation();
    setSelectedSaiposUser(userToConfigure);
    setSaiposFormData({
      saiposEnabled: Boolean(userToConfigure.saiposEnabled),
      saiposStoreId: userToConfigure.saiposStoreId || "",
      saiposMerchantId: userToConfigure.saiposMerchantId || "",
      saiposToken: userToConfigure.saiposToken || "",
    });
  }

  function handleSaiposInputChange(event: ChangeEvent<HTMLInputElement>) {
    const { name, type: inputType, checked, value } = event.target;

    setSaiposFormData((currentFormData) => ({
      ...currentFormData,
      [name]: inputType === "checkbox" ? checked : value,
    }));
  }

  function handleCloseSaiposModal() {
    if (savingSaipos) {
      return;
    }

    setSelectedSaiposUser(null);
  }

  async function handleCopySaiposWebhook() {
    try {
      await navigator.clipboard.writeText(SAIPOS_WEBHOOK_URL);
      alert("URL do webhook copiada!");
    } catch {
      alert(`URL do webhook: ${SAIPOS_WEBHOOK_URL}`);
    }
  }

  async function handleSaveSaiposIntegration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedSaiposUser || savingSaipos) {
      return;
    }

    const saiposStoreId = saiposFormData.saiposStoreId.trim();
    const payload = {
      saiposEnabled: saiposFormData.saiposEnabled,
      saiposStoreId,
      saiposMerchantId: saiposFormData.saiposMerchantId.trim() || saiposStoreId,
      saiposToken: saiposFormData.saiposToken.trim(),
    };

    try {
      setSavingSaipos(true);
      await api.put(`/user/${selectedSaiposUser.user}`, payload);
      setUsers((currentUsers) =>
        currentUsers.map((currentUser) =>
          currentUser.user === selectedSaiposUser.user
            ? {
                ...currentUser,
                ...payload,
              }
            : currentUser,
        ),
      );
      setSelectedSaiposUser(null);
      alert("Integração Saipos salva com sucesso.");
    } catch (error: unknown) {
      const responseMessage = (
        error as { response?: { data?: { message?: string } } }
      )?.response?.data?.message;
      const message =
        responseMessage ||
        (error instanceof Error ? error.message : undefined) ||
        "Não foi possível salvar a integração Saipos. Tente novamente.";
      alert(message);
    } finally {
      setSavingSaipos(false);
    }
  }

  useEffect(() => {
    async function loadFirstPage() {
      try {
        await getData(1);
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Erro ao carregar usuários.";
        alert(message);
      } finally {
        setLoading(false);
      }
    }

    loadFirstPage();
  }, [getData]);

  return (
    <Container>
      <Content>
        <HeaderFilter>
          <Filter isSelected={type === "shopkeeper"} onClick={handleShopkeeper}>
            Lojistas
          </Filter>
          <Filter isSelected={type === "motoboy"} onClick={handleMotoboys}>
            Motoboys
          </Filter>
        </HeaderFilter>

        <UsersContainer>
          {loading ? (
            <ContainerLoading>
              <Loader size={40} biggestColor="green" smallestColor="gray" />
            </ContainerLoading>
          ) : (
            <>
              {users.map((user: User) => (
                <UserContainer
                  key={user.id}
                  onClick={() => handleUser(user.user)}
                >
                  <ContainerProfileImage>
                    <ProfileImage src={user.profileImage} />
                  </ContainerProfileImage>
                  <UserInfo>
                    <Username>{user.name}</Username>
                    {type === "shopkeeper" && (
                      <>
                        <IntegrationStatus>
                          Anota AI: {user.anotaAiEnabled ? "Ativa" : "Inativa"}
                        </IntegrationStatus>
                        <ConfigureButton
                          type="button"
                          onClick={(event) =>
                            handleConfigureAnotaAi(event, user.user)
                          }
                        >
                          Configurar Anota AI
                        </ConfigureButton>
                        <IntegrationStatus>
                          Saipos: {user.saiposEnabled ? "Ativa" : "Inativa"}
                        </IntegrationStatus>
                        <ConfigureButton
                          type="button"
                          onClick={(event) =>
                            handleConfigureSaipos(event, user)
                          }
                        >
                          Configurar Saipos
                        </ConfigureButton>
                      </>
                    )}
                  </UserInfo>
                </UserContainer>
              ))}

              {hasMoreUsers && (
                <LoadMoreButton
                  type="button"
                  onClick={handleLoadMore}
                  disabled={loadingMore}
                >
                  {loadingMore ? "Carregando..." : "Mostrar mais"}
                </LoadMoreButton>
              )}
            </>
          )}
        </UsersContainer>

        {selectedSaiposUser && (
          <ModalBackdrop onClick={handleCloseSaiposModal}>
            <ModalCard onClick={(event) => event.stopPropagation()}>
              <form onSubmit={handleSaveSaiposIntegration}>
                <h2>Configurar Saipos</h2>

                <ModalCheckboxLabel htmlFor="saiposEnabled">
                  <input
                    id="saiposEnabled"
                    name="saiposEnabled"
                    type="checkbox"
                    checked={saiposFormData.saiposEnabled}
                    onChange={handleSaiposInputChange}
                  />
                  Ativar integração Saipos para esta empresa
                </ModalCheckboxLabel>

                <ModalField>
                  <label htmlFor="saiposStoreId">ID da Loja Saipos</label>
                  <ModalInput
                    id="saiposStoreId"
                    name="saiposStoreId"
                    type="text"
                    placeholder="Ex: 91080"
                    value={saiposFormData.saiposStoreId}
                    onChange={handleSaiposInputChange}
                  />
                </ModalField>

                <ModalField>
                  <label htmlFor="saiposMerchantId">Merchant ID Saipos</label>
                  <ModalInput
                    id="saiposMerchantId"
                    name="saiposMerchantId"
                    type="text"
                    placeholder="Opcional. Se vazio, usa o mesmo ID da loja."
                    value={saiposFormData.saiposMerchantId}
                    onChange={handleSaiposInputChange}
                  />
                </ModalField>

                <ModalField>
                  <label htmlFor="saiposToken">Token Saipos</label>
                  <ModalInput
                    id="saiposToken"
                    name="saiposToken"
                    type="text"
                    placeholder="Token opcional para validar webhook"
                    value={saiposFormData.saiposToken}
                    onChange={handleSaiposInputChange}
                  />
                </ModalField>

                <ModalField>
                  <span>URL do webhook</span>
                  <WebhookUrlBox>{SAIPOS_WEBHOOK_URL}</WebhookUrlBox>
                </ModalField>

                <ModalActions>
                  <ModalButton type="button" onClick={handleCopySaiposWebhook}>
                    Copiar URL do Webhook
                  </ModalButton>
                  <ModalButton
                    type="button"
                    variant="secondary"
                    onClick={handleCloseSaiposModal}
                    disabled={savingSaipos}
                  >
                    Cancelar
                  </ModalButton>
                  <ModalButton type="submit" disabled={savingSaipos}>
                    {savingSaipos ? "Salvando..." : "Salvar integração"}
                  </ModalButton>
                </ModalActions>
              </form>
            </ModalCard>
          </ModalBackdrop>
        )}
      </Content>
    </Container>
  );
}
