import {
  useCallback,
  useContext,
  useEffect,
  useState,
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
  ContainerProfileImage,
  ProfileImage,
  ContainerLoading,
  LoadMoreButton,
} from "./styles";
import { Loader } from "../../components/Loader";
import { User } from "../../shared/interfaces";

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
      </Content>
    </Container>
  );
}
