/* eslint-disable @typescript-eslint/no-explicit-any */
import { useContext, useEffect, useState } from 'react';

import { DeliveryContext } from '../../context/DeliveryContext';
import api from '../../services/api';
import { Loader } from '../../components/Loader';
import { User } from '../../shared/interfaces';
import {
  Actions,
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
} from './styles.ts';

export function IfoodClients() {
  const { token } = useContext(DeliveryContext);
  api.defaults.headers.Authorization = `Bearer ${token}`;

  const [loading, setLoading] = useState(true);
  const [savingUser, setSavingUser] = useState('');
  const [shopkeepers, setShopkeepers] = useState<User[]>([]);

  async function loadShopkeepers() {
    setLoading(true);

    try {
      const usersResponse = await api.get('/user?type=shopkeeper&itemsPerPage=100');
      const users = Array.isArray(usersResponse.data?.data)
        ? usersResponse.data.data
        : [];

      setShopkeepers(users);
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Erro ao buscar lojistas.');
    } finally {
      setLoading(false);
    }
  }

  function updateLocalUser(userId: string, changes: Partial<User>) {
    setShopkeepers((currentUsers) =>
      currentUsers.map((shopkeeper) =>
        shopkeeper.id === userId ? { ...shopkeeper, ...changes } : shopkeeper,
      ),
    );
  }

  async function handleSave(shopkeeper: User) {
    if (savingUser) {
      return;
    }

    const merchantId = (shopkeeper.ifoodMerchantId || '').trim();
    if (shopkeeper.useIfoodIntegration && !merchantId) {
      alert('Informe o Merchant ID para ativar a integração iFood.');
      return;
    }

    setSavingUser(shopkeeper.user);

    try {
      await api.put(`/user/${shopkeeper.id}`, {
        useIfoodIntegration: Boolean(shopkeeper.useIfoodIntegration),
        ifoodMerchantId: merchantId,
      });

      alert('Configuração iFood salva com sucesso.');
    } catch (error: any) {
      alert(error?.response?.data?.message || 'Erro ao salvar configuração iFood.');
    } finally {
      setSavingUser('');
    }
  }

  useEffect(() => {
    loadShopkeepers();
  }, []);

  return (
    <Container>
      <Content>
        <Title>Clientes iFood</Title>
        <Subtitle>
          Vincule cada lojista ao Merchant ID do iFood para permitir a importação
          dos pedidos corretamente.
        </Subtitle>

        {loading ? (
          <LoadingContainer>
            <Loader size={40} biggestColor="green" smallestColor="gray" />
          </LoadingContainer>
        ) : (
          shopkeepers.map((shopkeeper) => (
            <Card key={shopkeeper.id}>
              <ShopkeeperName>{shopkeeper.name}</ShopkeeperName>

              <Actions>
                <Checkbox>
                  <input
                    checked={Boolean(shopkeeper.useIfoodIntegration)}
                    onChange={(event) =>
                      updateLocalUser(shopkeeper.id, {
                        useIfoodIntegration: event.target.checked,
                        ifoodMerchantId: event.target.checked
                          ? shopkeeper.ifoodMerchantId
                          : '',
                      })
                    }
                    type="checkbox"
                  />
                  Usar integração iFood
                </Checkbox>

                <div>
                  <MerchantIdLabel htmlFor={`merchant-${shopkeeper.id}`}>
                    Merchant ID
                  </MerchantIdLabel>
                  <Input
                    disabled={!shopkeeper.useIfoodIntegration}
                    id={`merchant-${shopkeeper.id}`}
                    onChange={(event) =>
                      updateLocalUser(shopkeeper.id, {
                        ifoodMerchantId: event.target.value,
                      })
                    }
                    placeholder="Ex.: 12345678-90ab-cdef-1234-567890abcdef"
                    value={shopkeeper.ifoodMerchantId || ''}
                  />
                </div>
              </Actions>

              <SaveButton
                disabled={savingUser === shopkeeper.user}
                onClick={() => handleSave(shopkeeper)}
                type="button"
              >
                {savingUser === shopkeeper.user ? (
                  <Loader size={20} biggestColor="gray" smallestColor="gray" />
                ) : (
                  'Salvar'
                )}
              </SaveButton>
            </Card>
          ))
        )}
      </Content>
    </Container>
  );
}